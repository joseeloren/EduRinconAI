import { auth } from '@/auth';
import { db } from '@/db';
import { assistantDocuments, documentChunks } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const docs = await db.select().from(assistantDocuments);

        const chunkStats = await db.select({
            assistantId: documentChunks.assistantId,
            count: sql<number>`count(*)`
        }).from(documentChunks).groupBy(documentChunks.assistantId);

        const sampleChunks = await db.select({
            id: documentChunks.id,
            assistantId: documentChunks.assistantId,
            content: documentChunks.content,
        }).from(documentChunks).limit(5);

        return Response.json({
            documents: docs,
            chunkStats: chunkStats,
            sampleChunks: sampleChunks.map(c => ({
                ...c,
                content: c.content.substring(0, 50) + '...'
            }))
        });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
