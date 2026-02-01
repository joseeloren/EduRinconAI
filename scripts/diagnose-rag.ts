import { db } from '../db';
import { assistantDocuments, documentChunks } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

async function diagnoseRAG() {
    console.log('--- RAG DIAGNOSTIC START ---');

    // 1. List all documents
    const docs = await db.select().from(assistantDocuments);
    console.log(`Total documents in DB: ${docs.length}`);
    docs.forEach(d => {
        console.log(`- Doc: ${d.name} (ID: ${d.id}, Assistant: ${d.assistantId}, Status: ${d.status})`);
    });

    // 2. Count chunks per assistant
    const chunkCounts = await db.select({
        assistantId: documentChunks.assistantId,
        count: sql<number>`count(*)`
    }).from(documentChunks).groupBy(documentChunks.assistantId);

    console.log('\n--- Chunk Counts per Assistant ---');
    chunkCounts.forEach(c => {
        console.log(`- Assistant ${c.assistantId}: ${c.count} chunks`);
    });

    // 3. Sample chunk check
    if (docs.length > 0) {
        const sampleChunks = await db.select().from(documentChunks).limit(1);
        if (sampleChunks.length > 0) {
            console.log('\n--- Sample Chunk ---');
            console.log(`Content snippet: ${sampleChunks[0].content.substring(0, 50)}...`);
            console.log(`Embedding size: ${sampleChunks[0].embedding?.length || 0}`);
        } else {
            console.log('\n[WARNING] No chunks found in document_chunks table!');
        }
    }

    console.log('\n--- RAG DIAGNOSTIC END ---');
    process.exit(0);
}

diagnoseRAG().catch(err => {
    console.error('Diagnostic failed:', err);
    process.exit(1);
});
