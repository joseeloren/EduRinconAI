import { Agent, fetch as undiciFetch } from 'undici';

const getBaseURL = () => {
    let url = process.env.LLM_API_BASE_URL || 'http://localhost:11434';
    return url.replace(/\/+$/, '').replace(/\/v1$/, '');
};

const EMBEDDING_MODEL = process.env.LLM_EMBEDDING_MODEL || 'nomic-embed-text';
const TIMEOUT_MS = 300000; // 5 minutes

export async function generateEmbedding(text: string): Promise<number[]> {
    const baseURL = getBaseURL();
    const url = `${baseURL}/api/embeddings`;

    const response = await undiciFetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            prompt: text,
        }),
        dispatcher: new Agent({
            headersTimeout: TIMEOUT_MS,
            bodyTimeout: TIMEOUT_MS,
            connect: { timeout: 60000 }
        }) as any,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama embedding error: ${error}`);
    }

    const data = (await response.json()) as { embedding: number[] };
    return data.embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Ollama typically handles one at a time via /api/embeddings, 
    // but we can loop or check if there is a batch API.
    // For now, simple loop.
    return Promise.all(texts.map(text => generateEmbedding(text)));
}
