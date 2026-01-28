import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { documents, embeddings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const document = await db.query.documents.findFirst({
            where: eq(documents.id, params.id),
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role === 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const document = await db.query.documents.findFirst({
            where: eq(documents.id, params.id),
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Delete embeddings first (due to foreign key)
        await db.delete(embeddings).where(eq(embeddings.documentId, params.id));

        // Delete document record
        await db.delete(documents).where(eq(documents.id, params.id));

        // Delete physical file
        try {
            const uploadDir = process.env.UPLOAD_DIR || './uploads';
            const filePath = join(process.cwd(), uploadDir, document.filename);
            await unlink(filePath);
        } catch (fileError) {
            console.error('Error deleting physical file:', fileError);
            // Don't fail the request if file deletion fails
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
