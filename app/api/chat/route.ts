import { auth } from '@/auth';
import { db } from '@/db';
import { assistants, chats, messages, assistantAccess } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { retrieveContext, formatContextForPrompt } from '@/lib/rag/retriever';
import { canAccessAssistant } from '@/lib/auth/roles';

// Helper to ensure baseURL ends with /v1
const getBaseURL = () => {
    let url = process.env.LLM_API_BASE_URL || 'http://localhost:11434';
    if (!url.endsWith('/v1')) {
        url = `${url}/v1`;
    }
    return url;
};

// Configure OpenAI provider for Ollama/LocalAI
const ollama = createOpenAI({
    baseURL: getBaseURL(),
    apiKey: 'ollama',
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

        // Get last user message for RAG retrieval
        const lastUserMessage = chatMessages
            .filter((m: any) => m.role === 'user')
            .pop();

        // Retrieve relevant context from RAG
        const contexts = await retrieveContext(
            lastUserMessage.content,
            assistantId,
            5,
            0.6
        );

        const contextText = formatContextForPrompt(contexts);

        // Build messages with system prompt and context
        const systemMessage = {
            role: 'system' as const,
            content: `${assistant.systemPrompt}\n\n${contextText}`,
        };

        const allMessages = [systemMessage, ...chatMessages];

        // Save user message
        await db.insert(messages).values({
            chatId: chat.id,
            role: 'user',
            content: lastUserMessage.content,
        });

        // Stream response
        const modelName = process.env.LLM_MODEL_NAME || 'llama3.2';
        console.log('Using LLM model:', modelName);

        const result = await streamText({
            model: ollama(modelName),
            messages: allMessages,
            temperature: (assistant.temperature || 70) / 100,
            maxTokens: 2000,
            async onFinish({ text }) {
                // Save assistant message with sources
                await db.insert(messages).values({
                    chatId: chat.id,
                    role: 'assistant',
                    content: text,
                    sources: contexts.map((ctx) => ({
                        documentId: ctx.documentId,
                        documentName: ctx.documentName,
                        similarity: ctx.similarity,
                    })),
                });
            },
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('Chat API Error Details:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });

        return new Response(
            JSON.stringify({
                error: 'Internal Server Error',
                details: error instanceof Error ? error.message : String(error)
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
