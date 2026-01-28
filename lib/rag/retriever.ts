import { db } from '@/db';
import { embeddings, documents } from '@/db/schema';
import { generateEmbedding } from '@/lib/llm/client';
import { sql, eq, and } from 'drizzle-orm';

export interface RetrievedContext {
    documentId: string;
    documentName: string;
    chunkText: string;
    similarity: number;
    metadata: any;
}

/**
 * Calculate cosine similarity between two vectors in PostgreSQL
 * Uses pgvector's <=> operator (cosine distance), then converts to similarity
 */
export async function retrieveContext(
    query: string,
    assistantId: string,
    topK: number = 5,
    minSimilarity: number = 0.5
): Promise<RetrievedContext[]> {
    try {
        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);

        // Convert to pgvector format (array as string)
        const vectorString = `[${queryEmbedding.join(',')}]`;

        // Retrieve most similar chunks using pgvector cosine similarity
        // Note: <=> returns cosine distance (0 = identical, 2 = opposite)
        // We convert to similarity: 1 - (distance / 2)
        const results = await db
            .select({
                documentId: embeddings.documentId,
                documentName: documents.originalName,
                chunkText: embeddings.chunkText,
                distance: sql<number>`${embeddings.embedding} <=> ${vectorString}::vector`,
                metadata: embeddings.metadata,
            })
            .from(embeddings)
            .innerJoin(documents, eq(embeddings.documentId, documents.id))
            .where(eq(documents.assistantId, assistantId))
            .orderBy(sql`${embeddings.embedding} <=> ${vectorString}::vector`)
            .limit(topK);

        // Convert distance to similarity and filter
        const contextResults: RetrievedContext[] = results
            .map((result) => ({
                documentId: result.documentId,
                documentName: result.documentName,
                chunkText: result.chunkText,
                similarity: 1 - result.distance / 2, // Convert cosine distance to similarity
                metadata: result.metadata,
            }))
            .filter((result) => result.similarity >= minSimilarity);

        return contextResults;
    } catch (error) {
        console.error('Error retrieving context:', error);
        return [];
    }
}

/**
 * Format retrieved context for LLM prompt
 */
export function formatContextForPrompt(contexts: RetrievedContext[]): string {
    if (contexts.length === 0) {
        return 'No relevant context found in the knowledge base.';
    }

    const formattedSections = contexts.map((ctx, index) => {
        return `[Document ${index + 1}: ${ctx.documentName}]\n${ctx.chunkText}\n`;
    });

    return `Relevant information from the knowledge base:\n\n${formattedSections.join('\n---\n\n')}`;
}
