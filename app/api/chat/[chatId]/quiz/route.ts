import { auth } from '@/auth';
import { db } from '@/db';
import { chats, messages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { Agent, fetch as undiciFetch } from 'undici';

const getBaseURL = () => {
    let url = process.env.LLM_API_BASE_URL || 'http://localhost:11434';
    return url.replace(/\/+$/, '').replace(/\/v1$/, '');
};

const LLM_MODEL_NAME = process.env.LLM_MODEL_NAME || 'llama3';
const LLM_HEADERS_TIMEOUT_MS = parseInt(process.env.LLM_HEADERS_TIMEOUT_MS || '600000', 10);
const LLM_BODY_TIMEOUT_MS = parseInt(process.env.LLM_BODY_TIMEOUT_MS || '1200000', 10);

const ollama = createOllama({
    baseURL: getBaseURL() + '/api',
    fetch: (input, init) => {
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
        } as any).finally(() => clearTimeout(timeoutId)) as unknown as Promise<Response>;
    }
});

export async function GET(
    request: Request,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { chatId } = await params;

        // Verify chat ownership
        const [chat] = await db
            .select()
            .from(chats)
            .where(eq(chats.id, chatId))
            .limit(1);

        if (!chat || chat.userId !== session.user.id) {
            return new Response('Forbidden', { status: 403 });
        }

        // Fetch recent messages for context
        const chatMessages = await db.query.messages.findMany({
            where: eq(messages.chatId, chatId),
            orderBy: [desc(messages.createdAt)],
            limit: 20,
        });

        const context = chatMessages
            .reverse()
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n');

        const systemPrompt = `You are an educational assistant. Based on the following conversation history, generate a quiz with 5 multiple-choice questions to test the user's knowledge.
Respond ONLY with a JSON array of objects. Each object must have:
- question: string
- options: string array (exactly 4 options)
- correctAnswerIndex: number (0-3)
- explanation: string (explaining why the answer is correct)

Conversation history:
${context}`;

        const { text } = await generateText({
            model: ollama(LLM_MODEL_NAME),
            prompt: systemPrompt,
        });

        // Try to parse the output and ensure it's valid JSON
        try {
            const jsonStart = text.indexOf('[');
            const jsonEnd = text.lastIndexOf(']') + 1;
            const jsonStr = text.substring(jsonStart, jsonEnd);
            const quiz = JSON.parse(jsonStr);
            return Response.json(quiz);
        } catch (e) {
            console.error('Failed to parse quiz JSON:', text);
            return new Response('Failed to generate a valid quiz structural format.', { status: 500 });
        }
    } catch (error) {
        console.error('[Quiz API Error]:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
