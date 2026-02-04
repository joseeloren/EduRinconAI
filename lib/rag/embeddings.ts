import * as undici from 'undici';

const getBaseURL = () => {
    let url = process.env.LLM_API_BASE_URL || 'http://localhost:1234/v1';
    if (!url.endsWith('/v1')) {
        url = url.replace(/\/+$/, '') + '/v1';
    }
    return url;
};

const getAPIKey = () => process.env.LLM_API_KEY || 'lm-studio';
const EMBEDDING_MODEL = process.env.LLM_EMBEDDING_MODEL || 'text-embedding-nomic-embed-text-v1.5';
const TIMEOUT_MS = 300000; // 5 minutes

export async function generateEmbedding(text: string): Promise<number[]> {
    const baseURL = getBaseURL();
    const url = `${baseURL}/embeddings`;

    const response = await (undici.fetch as any)(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAPIKey()}`,
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: text,
        }),
        dispatcher: new undici.Agent({
            headersTimeout: TIMEOUT_MS,
            bodyTimeout: TIMEOUT_MS,
            connect: { timeout: 60000 }
        }) as any,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`LM Studio embedding error: ${error}`);
    }

    const data = (await response.json()) as { data: { embedding: number[] }[] };
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Invalid embedding response format from LM Studio');
    }
    return data.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Ollama typically handles one at a time via /api/embeddings, 
    // but we can loop or check if there is a batch API.
    // For now, simple loop.
    return Promise.all(texts.map(text => generateEmbedding(text)));
}
