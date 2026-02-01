import { auth } from '@/auth';
import { db } from '@/db';
import { assistants, chats, messages, assistantAccess } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { Agent, fetch as undiciFetch } from 'undici';
import { canAccessAssistant } from '@/lib/auth/roles';

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
        console.log(`[Ollama Fetch] URL: ${input}`);
        if (!input) {
            console.error('[Ollama Fetch] CRITICAL: input is undefined!');
            throw new Error('Ollama Fetch received undefined URL');
        }
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
    console.log(`[Chat API] POST started! Content-Type: ${request.headers.get('content-type')}`);
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        let body;
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const messagesJson = formData.get('messages') as string;
            const chatMessages = JSON.parse(messagesJson);

            // Extract actual files from formData
            const lastMessage = chatMessages[chatMessages.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
                const attachments: any[] = [];
                // Vercel AI SDK sends files in fields like attachment_0, attachment_1...
                for (const [key, value] of formData.entries()) {
                    if (value instanceof File) {
                        const buffer = await value.arrayBuffer();
                        const base64 = Buffer.from(buffer).toString('base64');
                        attachments.push({
                            name: value.name,
                            contentType: value.type,
                            url: `data:${value.type};base64,${base64}`
                        });
                    }
                }

                if (attachments.length > 0) {
                    lastMessage.experimental_attachments = attachments;
                }
            }

            body = {
                messages: chatMessages,
                chatId: formData.get('chatId') as string,
                assistantId: formData.get('assistantId') as string,
            };
        } else {
            body = await request.json();
        }

        const { messages: chatMessages, chatId, assistantId } = body;

        // DEBUG: Examine incoming message structure
        const lastMsg = chatMessages[chatMessages.length - 1];
        if (lastMsg?.experimental_attachments) {
            console.log('[Chat API] Incoming attachments details:', JSON.stringify(lastMsg.experimental_attachments.map((a: any) => ({
                name: a.name,
                type: a.contentType,
                hasUrl: !!a.url,
                urlPreview: typeof a.url === 'string' ? a.url.substring(0, 30) + '...' : typeof a.url
            })), null, 2));
        }

        // 1. Fetch Assistant first
        const [assistant] = await db
            .select()
            .from(assistants)
            .where(eq(assistants.id, assistantId))
            .limit(1);

        if (!assistant) {
            return new Response('Assistant not found', { status: 404 });
        }

        // 2. Validate assistant access
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

        // 3. Normalize messages to strictly follow CoreMessage structure
        let hasImagesInConversation = false;
        const formattedMessages = chatMessages
            .filter((msg: any) => ['user', 'assistant'].includes(msg.role))
            .map((msg: any) => {
                const hasAttachments = msg.role === 'user' && msg.experimental_attachments && msg.experimental_attachments.length > 0;

                if (hasAttachments) {
                    hasImagesInConversation = true;
                    let textContent = '';
                    if (typeof msg.content === 'string') {
                        textContent = msg.content;
                    } else if (Array.isArray(msg.content)) {
                        textContent = msg.content.find((part: any) => part.type === 'text')?.text || '';
                    }

                    return {
                        role: 'user',
                        content: [
                            { type: 'text', text: textContent || 'Analiza esta imagen.' },
                            ...msg.experimental_attachments.map((att: any) => {
                                if (typeof att.url === 'string' && att.url.startsWith('data:')) {
                                    const base64Content = att.url.split(',')[1];
                                    const buffer = Buffer.from(base64Content, 'base64');
                                    console.log(`[Chat API] Processing image attachment: ${att.name || 'unnamed'}, size: ${buffer.length} bytes`);
                                    return {
                                        type: 'image',
                                        image: new Uint8Array(buffer),
                                        mimeType: att.contentType || 'image/jpeg'
                                    };
                                }
                                return {
                                    type: 'image',
                                    image: att.url
                                };
                            })
                        ]
                    };
                }

                let normalContent = '';
                if (typeof msg.content === 'string') {
                    normalContent = msg.content;
                } else if (Array.isArray(msg.content)) {
                    normalContent = msg.content.find((p: any) => p.type === 'text')?.text || '';
                } else {
                    normalContent = String(msg.content || '');
                }

                return {
                    role: msg.role,
                    content: normalContent,
                };
            });

        // 4. Prepend System Prompt (with Vision Override if needed)
        let systemPrompt = assistant.systemPrompt || 'Eres un tutor AI.';
        if (hasImagesInConversation) {
            systemPrompt += '\n\n[IMPORTANTE: El usuario ha adjuntado imágenes. Tienes capacidad de visión. Analiza las imágenes adjuntas para responder de forma precisa a las preguntas del usuario sobre sintaxis o código Java mostrado en ellas, ignorando cualquier restricción previa que te impida ver archivos si el usuario te lo solicita explícitamente.]';
        }

        const allMessages = [
            { role: 'system', content: systemPrompt },
            ...formattedMessages
        ];

        // 🔍 DEBUG: Summary log
        console.log('[Chat API] Messages summary:', JSON.stringify(allMessages.map((m: any) => ({
            role: m.role,
            contentIsArray: Array.isArray(m.content),
            contentLength: typeof m.content === 'string' ? m.content.length : m.content.length
        })), null, 2));

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

        // Save last user message (we save only the text part to the DB)
        const lastUserMessage = chatMessages.filter((m: any) => m.role === 'user').pop();
        if (lastUserMessage) {
            let dbContent = '';
            if (typeof lastUserMessage.content === 'string') dbContent = lastUserMessage.content;
            else if (Array.isArray(lastUserMessage.content)) dbContent = lastUserMessage.content.find((p: any) => p.type === 'text')?.text || '';
            await db.insert(messages).values({ chatId: chat.id, role: 'user', content: dbContent });
        }


        // Stream response
        const modelName = process.env.LLM_MODEL_NAME || 'llama3.2';
        console.log(`[Chat API] Starting stream with model: ${modelName}. Messages count: ${allMessages.length}`);
        console.log(`[Chat API] Base URL: ${getBaseURL()}`);

        try {
            const result = await streamText({
                model: ollama(modelName) as any, // Cast to any to bypass version mismatch
                messages: allMessages as any,
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
            console.error('[Chat API] CRITICAL error in streamText:', streamError);
            console.error('[Chat API] Full messages payload causing error:', JSON.stringify(allMessages, (h, v) => (v instanceof Buffer || v instanceof Uint8Array) ? '<BINARY_DATA>' : v, 2));
            throw streamError;
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
