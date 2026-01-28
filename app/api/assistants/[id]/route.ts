import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { assistants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const assistant = await db.query.assistants.findFirst({
            where: eq(assistants.id, params.id),
            with: {
                creator: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!assistant) {
            return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
        }

        // Check permissions
        if (
            session.user.role !== 'ADMIN' &&
            assistant.createdById !== session.user.id
        ) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(assistant);
    } catch (error) {
        console.error('Error fetching assistant:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role === 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, systemPrompt, temperature, isPublic } = body;

        // Verify ownership
        const existing = await db.query.assistants.findFirst({
            where: eq(assistants.id, params.id),
        });

        if (!existing) {
            return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
        }

        if (
            session.user.role !== 'ADMIN' &&
            existing.createdById !== session.user.id
        ) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update assistant
        const [updated] = await db
            .update(assistants)
            .set({
                name,
                description,
                systemPrompt,
                temperature,
                isPublic: isPublic ? 1 : 0,
                updatedAt: new Date(),
            })
            .where(eq(assistants.id, params.id))
            .returning();

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating assistant:', error);
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

        // Verify ownership
        const existing = await db.query.assistants.findFirst({
            where: eq(assistants.id, params.id),
        });

        if (!existing) {
            return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
        }

        if (
            session.user.role !== 'ADMIN' &&
            existing.createdById !== session.user.id
        ) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete assistant (cascade will handle related records)
        await db.delete(assistants).where(eq(assistants.id, params.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting assistant:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
