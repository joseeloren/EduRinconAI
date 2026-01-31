import { auth } from '@/auth';
import { db } from '@/db';
import { assistants, chats, messages, assistantAccess } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';

// Helper to ensure baseURL is correct for Ollama
const getBaseURL = () => {
    let url = process.env.LLM_API_BASE_URL || 'http://localhost:11434';
    // Remove trailing slash and /v1 if present (native provider appends /api/chat)
    return url.replace(/\/+$/, '').replace(/\/v1$/, '');
};

// Timeouts para Ollama: modelos grandes (ej. deepseek-r1:70b) pueden tardar mucho en cargar y responder
const LLM_HEADERS_TIMEOUT_MS = parseInt(process.env.LLM_HEADERS_TIMEOUT_MS || '600000', 10); // 10 min
const LLM_BODY_TIMEOUT_MS = parseInt(process.env.LLM_BODY_TIMEOUT_MS || '1200000', 10);     // 20 min

// Configure Native Ollama provider (bypasses OpenAI compatibility layer)
const ollama = createOllama({
    baseURL: getBaseURL() + '/api', // ollama-ai-provider expects base URL (often with /api)
    fetch: (input, init) => {
        // Custom fetch payload to support extended timeouts
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LLM_BODY_TIMEOUT_MS);

        return undiciFetch(input as any, {
            ...init,
            dispatcher: new Agent({
                headersTimeout: LLM_HEADERS_TIMEOUT_MS,
                bodyTimeout: LLM_BODY_TIMEOUT_MS,
                connect: { timeout: 300000 }
            }) as any,
            signal: controller.signal
        } as any)
            .finally(() => clearTimeout(timeoutId)) as unknown as Promise<Response>;
    }
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

        console.error('Chat API Error Details:', {
            error,
            message,
            stack: error instanceof Error ? error.stack : undefined,
        });

        let userMessage = 'Ha ocurrido un error inesperado en el servidor.';

        if (message.includes('ECONNREFUSED')) {
            userMessage = 'No se puede conectar con Ollama (ECONNREFUSED). Asegúrate de que esté corriendo (`ollama serve`). Si estás usando WSL/Docker, `localhost` no verá tu host Windows: configura `LLM_API_BASE_URL` en tu .env apuntando a `http://host.docker.internal:11434` o la IP local de tu PC.';
        } else if (message.includes('Headers Timeout') || message.includes('HeadersTimeoutError')) {
            userMessage = 'El modelo está tardando demasiado en responder (Timeout). Es posible que sea un modelo muy pesado (70b) y tu PC esté tardando en cargarlo en memoria.';
        } else if (message.includes('Cannot connect to API')) {
            userMessage = 'Error de conexión con la API de IA. Verifica la URL y que el servicio esté activo.';
        } else {
            userMessage = message;
        }

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
