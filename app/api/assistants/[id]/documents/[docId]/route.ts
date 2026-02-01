import { auth } from '@/auth';
import { db } from '@/db';
import { assistantDocuments, assistants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; docId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: assistantId, docId } = await params;

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

        // Delete document (cascade will handle chunks)
        await db
            .delete(assistantDocuments)
            .where(
                and(
                    eq(assistantDocuments.id, docId),
                    eq(assistantDocuments.assistantId, assistantId)
                )
            );

        return Response.json({ success: true });
    } catch (error) {
        console.error('Document deletion error:', error);
        return Response.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}
