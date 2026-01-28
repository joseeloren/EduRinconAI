import OpenAI from 'openai';

if (!process.env.LLM_API_BASE_URL) {
    throw new Error('LLM_API_BASE_URL environment variable is not set');
}

// Create OpenAI client configured for Ollama/LocalAI
export const llmClient = new OpenAI({
    baseURL: process.env.LLM_API_BASE_URL,
    apiKey: 'ollama', // Ollama doesn't require a real API key
});

export const LLM_MODEL = process.env.LLM_MODEL_NAME || 'llama3.2';
export const EMBEDDING_MODEL = process.env.LLM_EMBEDDING_MODEL || 'nomic-embed-text';

/**
 * Generate chat completion with streaming
 */
export async function createChatCompletion(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: {
        temperature?: number;
        maxTokens?: number;
        stream?: boolean;
    }
) {
    try {
        const response = await llmClient.chat.completions.create({
            model: LLM_MODEL,
            messages,
            temperature: options?.temperature || 0.7,
            max_tokens: options?.maxTokens || 2000,
            stream: options?.stream || false,
        });

        return response;
    } catch (error) {
        console.error('Error creating chat completion:', error);
        throw new Error('Failed to generate response from LLM');
    }
}

/**
 * Generate embeddings for text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await llmClient.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text,
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        const embeddings: number[][] = [];

        // Process in batches of 10 to avoid overwhelming the API
        for (let i = 0; i < texts.length; i += 10) {
            const batch = texts.slice(i, i + 10);
            const batchResults = await Promise.all(
                batch.map((text) => generateEmbedding(text))
            );
            embeddings.push(...batchResults);
        }

        return embeddings;
    } catch (error) {
        console.error('Error generating embeddings batch:', error);
        throw new Error('Failed to generate embeddings');
    }
}
