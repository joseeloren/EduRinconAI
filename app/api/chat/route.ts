import { auth } from '@/auth';
import { db } from '@/db';
import { assistants, chats, messages, assistantAccess } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { Agent, fetch as undiciFetch } from 'undici';

import { canAccessAssistant } from '@/lib/auth/roles';

// Helper to ensure baseURL ends with /v1
const getBaseURL = () => {
    let url = process.env.LLM_API_BASE_URL || 'http://localhost:11434';

    // Trim whitespace and remove ALL trailing slashes
    url = url.trim().replace(/\/+$/, '');

    // Append /v1 if not present
    if (!url.endsWith('/v1')) {
        url = `${url}/v1`;
    }

    return url;
};

// Timeouts para Ollama: modelos grandes (ej. deepseek-r1:32b) pueden tardar 60+ seg en responder
const LLM_HEADERS_TIMEOUT_MS = parseInt(process.env.LLM_HEADERS_TIMEOUT_MS || '120000', 10); // 2 min
const LLM_BODY_TIMEOUT_MS = parseInt(process.env.LLM_BODY_TIMEOUT_MS || '300000', 10);     // 5 min

const ollamaFetchAgent = new Agent({
    connect: { timeout: 30000 },
    headersTimeout: LLM_HEADERS_TIMEOUT_MS,
    bodyTimeout: LLM_BODY_TIMEOUT_MS,
});

// Wrapper para usar undici con timeouts ampliados (compatible con tipos del AI SDK)
const ollamaFetch = (input: RequestInfo | URL, init?: RequestInit) =>
    undiciFetch(input as any, { ...init, dispatcher: ollamaFetchAgent } as any);

// Configure OpenAI provider for Ollama/LocalAI
const ollama = createOpenAI({
    baseURL: getBaseURL(),
    apiKey: process.env.LLM_API_KEY || 'ollama',
    fetch: ollamaFetch,
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { messages: chatMessages, chatId, assistantId } = await request.json();

        // Validate assistant access
        const [assistant] = await db
            .select()
            .from(assistants)
            .where(eq(assistants.id, assistantId))
            .limit(1);

        if (!assistant) {
            return new Response('Assistant not found', { status: 404 });
        }

        // Check if user has explicit access
        const [access] = await db
            .select()
            .from(assistantAccess)
            .where(
                and(
                    eq(assistantAccess.assistantId, assistantId),
                    eq(assistantAccess.userId, session.user.id)
                )
            )
            .limit(1);

        const hasAccess = canAccessAssistant(
            session.user.role,
            session.user.id,
            assistant.createdById,
            !!access,
            assistant.isPublic === 1
        );

        if (!hasAccess) {
            return new Response('Forbidden: No access to this assistant', { status: 403 });
        }

        // Get or create chat
        let chat;
        if (chatId) {
            [chat] = await db
                .select()
                .from(chats)
                .where(
                    and(
                        eq(chats.id, chatId),
                        eq(chats.userId, session.user.id)
                    )
                )
                .limit(1);
        }

        if (!chat) {
            [chat] = await db
                .insert(chats)
                .values({
                    userId: session.user.id,
                    assistantId: assistantId,
                    title: chatMessages[0]?.content?.slice(0, 50) || 'New Chat',
                })
                .returning();
        }

        // Process chat for pure LLM response (No RAG)

        // Build messages with system prompt
        const systemMessage = {
            role: 'system' as const,
            content: assistant.systemPrompt,
        };

        const allMessages = [systemMessage, ...chatMessages];

        // Save last user message
        const lastUserMessage = chatMessages
            .filter((m: any) => m.role === 'user')
            .pop();

        if (lastUserMessage) {
            await db.insert(messages).values({
                chatId: chat.id,
                role: 'user',
                content: lastUserMessage.content,
            });
        }


        // Stream response
        const modelName = process.env.LLM_MODEL_NAME || 'llama3.2';
        console.log(`[Chat API] Starting stream with model: ${modelName}`);
        console.log(`[Chat API] Base URL: ${getBaseURL()}`);

        try {
            const result = await streamText({
                model: ollama(modelName),
                messages: allMessages,
                temperature: (assistant.temperature || 70) / 100,
                maxTokens: 2000,
                // Add explicit error handling for the stream
                onFinish: async ({ text }) => {
                    console.log('[Chat API] Stream finished successfully');
                    try {
                        // Save assistant message
                        await db.insert(messages).values({
                            chatId: chat.id,
                            role: 'assistant',
                            content: text,
                        });
                    } catch (dbError) {
                        console.error('[Chat API] Failed to save assistant message:', dbError);
                    }
                },
            });

            return result.toDataStreamResponse();
        } catch (streamError) {
            console.error('[Chat API] Stream creation failed:', streamError);
            throw streamError; // Re-throw to be caught by outer try-catch
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isOllamaTimeout =
            message.includes('Headers Timeout') ||
            message.includes('HeadersTimeoutError') ||
            message.includes('Cannot connect to API');

        console.error('Chat API Error Details:', {
            error,
            message,
            stack: error instanceof Error ? error.stack : undefined,
        });

        const userMessage = isOllamaTimeout
            ? 'No se pudo conectar a Ollama. Verifica que Ollama esté corriendo y que LLM_API_BASE_URL apunte al servidor correcto (no uses localhost si Ollama está en otra máquina).'
            : message;

        return new Response(
            JSON.stringify({
                error: 'Internal Server Error',
                details: userMessage
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
