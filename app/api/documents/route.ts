import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const assistantId = searchParams.get('assistantId');

        if (!assistantId) {
            return NextResponse.json(
                { error: 'Assistant ID is required' },
                { status: 400 }
            );
        }

        const docs = await db.query.documents.findMany({
            where: eq(documents.assistantId, assistantId),
            orderBy: (documents, { desc }) => [desc(documents.createdAt)],
        });

        return NextResponse.json(docs);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
