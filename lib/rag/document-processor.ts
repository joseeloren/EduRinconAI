import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { generateEmbeddings } from '@/lib/llm/client';
import { db } from '@/db';
import { documents, embeddings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
}

/**
 * Extract text from DOCX file
 */
async function extractTextFromDOCX(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

/**
 * Extract text from a document based on its MIME type
 */
export async function extractText(
    filePath: string,
    mimeType: string
): Promise<string> {
    try {
        if (mimeType === 'application/pdf') {
            return await extractTextFromPDF(filePath);
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            return await extractTextFromDOCX(filePath);
        } else if (mimeType === 'text/plain') {
            return await fs.readFile(filePath, 'utf-8');
        } else {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to extract text from document');
    }
}

/**
 * Split text into chunks using LangChain's RecursiveCharacterTextSplitter
 */
export async function chunkText(text: string): Promise<string[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    const chunks = await splitter.splitText(text);
    return chunks;
}

/**
 * Process a document: extract text, chunk, generate embeddings, and store
 */
export async function processDocument(documentId: string): Promise<void> {
    try {
        // Get document from database
        const [document] = await db
            .select()
            .from(documents)
            .where(eq(documents.id, documentId))
            .limit(1);

        if (!document) {
            throw new Error('Document not found');
        }

        // Update status to PROCESSING
        await db
            .update(documents)
            .set({ status: 'PROCESSING' })
            .where(eq(documents.id, documentId));

        // Extract text
        const text = await extractText(document.filename, document.mimeType);

        if (!text || text.trim().length === 0) {
            throw new Error('No text extracted from document');
        }

        // Chunk text
        const chunks = await chunkText(text);

        if (chunks.length === 0) {
            throw new Error('No chunks created from document');
        }

        // Generate embeddings
        const embeddingVectors = await generateEmbeddings(chunks);

        // Store embeddings in database
        const embeddingRecords = chunks.map((chunk, index) => ({
            documentId: documentId,
            chunkText: chunk,
            chunkIndex: index,
            embedding: embeddingVectors[index],
            metadata: {
                totalChunks: chunks.length,
                chunkSize: chunk.length,
            },
        }));

        await db.insert(embeddings).values(embeddingRecords);

        // Update document status to COMPLETED
        await db
            .update(documents)
            .set({ status: 'COMPLETED' })
            .where(eq(documents.id, documentId));

        console.log(`Document ${documentId} processed successfully with ${chunks.length} chunks`);
    } catch (error) {
        console.error('Error processing document:', error);

        // Update document status to FAILED
        await db
            .update(documents)
            .set({
                status: 'FAILED',
                processingError: error instanceof Error ? error.message : 'Unknown error',
            })
            .where(eq(documents.id, documentId));

        throw error;
    }
}
