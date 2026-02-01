import { auth } from '@/auth';
import { db } from '@/db';
import { assistantDocuments, documentChunks, assistants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { generateEmbedding } from '@/lib/rag/embeddings';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: assistantId } = await params;

        // Verify assistant belongs to user (or admin)
        const [assistant] = await db
            .select()
            .from(assistants)
            .where(eq(assistants.id, assistantId))
            .limit(1);

        if (!assistant) {
            return Response.json({ error: 'Assistant not found' }, { status: 404 });
        }

        if (session.user.role !== 'ADMIN' && assistant.createdById !== session.user.id) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';
        let fileType = '';

        if (file.name.endsWith('.pdf')) {
            const data = await pdf(buffer);
            text = data.text;
            fileType = 'pdf';
        } else if (file.name.endsWith('.docx')) {
            const data = await mammoth.extractRawText({ buffer });
            text = data.value;
            fileType = 'docx';
        } else if (file.name.endsWith('.txt')) {
            text = buffer.toString('utf-8');
            fileType = 'txt';
        } else {
            return Response.json({ error: 'Unsupported file type' }, { status: 400 });
        }

        if (!text || text.trim().length < 10) {
            console.error(`[Ingestion] Text extraction failed or too short. Length: ${text?.length}`);
            return Response.json({ error: 'Document too short or unreadable' }, { status: 400 });
        }

        console.log(`[Ingestion] Successfully extracted ${text.length} characters from ${file.name}`);

        // 1. Save document metadata
        const [doc] = await db
            .insert(assistantDocuments)
            .values({
                assistantId,
                name: file.name,
                type: fileType,
                size: file.size,
                status: 'processing',
            })
            .returning();

        // 2. Split into chunks
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 800,
            chunkOverlap: 100,
        });

        const chunks = await splitter.splitText(text);
        console.log(`[Ingestion] Split document into ${chunks.length} chunks.`);

        let successCount = 0;

        // 3. Generate embeddings and save chunks
        for (const chunk of chunks) {
            if (chunk.trim().length === 0) continue;

            try {
                const embedding = await generateEmbedding(chunk);
                await db.insert(documentChunks).values({
                    documentId: doc.id,
                    assistantId,
                    content: chunk,
                    embedding,
                });
                successCount++;
            } catch (embedError) {
                console.error(`[Ingestion] Embedding error for chunk: ${chunk.substring(0, 50)}...`, embedError);
            }
        }

        console.log(`[Ingestion] Successfully stored ${successCount}/${chunks.length} chunks for doc: ${file.name}`);

        // 4. Update status based on success
        await db
            .update(assistantDocuments)
            .set({ status: successCount > 0 ? 'ready' : 'error' })
            .where(eq(assistantDocuments.id, doc.id));

        return Response.json({ success: successCount > 0, document: doc, chunksCreated: successCount });
    } catch (error) {
        console.error('Document ingestion error:', error);
        return Response.json({ error: 'Failed to process document' }, { status: 500 });
    }
}

// GET: List documents for an assistant
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: assistantId } = await params;

        const docs = await db
            .select()
            .from(assistantDocuments)
            .where(eq(assistantDocuments.assistantId, assistantId));

        return Response.json({ documents: docs });
    } catch (error) {
        console.error('List documents error:', error);
        return Response.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}
