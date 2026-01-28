import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userChats = await db.query.chats.findMany({
            where: eq(chats.userId, session.user.id),
            with: {
                assistant: {
                    columns: {
                        id: true,
                        name: true,
                    },
                },
                messages: {
                    orderBy: (messages, { desc }) => [desc(messages.createdAt)],
                    limit: 1,
                },
            },
            orderBy: (chats, { desc }) => [desc(chats.updatedAt)],
        });

        return NextResponse.json(userChats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get('id');

        if (!chatId) {
            return NextResponse.json(
                { error: 'Chat ID is required' },
                { status: 400 }
            );
        }

        // Verify ownership
        const chat = await db.query.chats.findFirst({
            where: eq(chats.id, chatId),
        });

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        if (chat.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete chat (cascade will delete messages)
        await db.delete(chats).where(eq(chats.id, chatId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
