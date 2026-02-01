import { auth } from '@/auth';
import { ChatView } from '@/components/chat/chat-view';
import { Navbar } from '@/components/ui/navbar';
import { db } from '@/db';
import { assistants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

import { messages } from '@/db/schema';

import { getTranslations } from 'next-intl/server';

// ... imports ...

export default async function ChatPage(props: {
    params: Promise<{ assistantId: string; locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await props.params;
    const { assistantId, locale } = params;
    const session = await auth();

    if (!session?.user) {
        return null;
    }

    const [assistant] = await db
        .select()
        .from(assistants)
        .where(eq(assistants.id, assistantId))
        .limit(1);

    if (!assistant) {
        notFound();
    }

    const t = await getTranslations({ locale, namespace: 'chat' });

    // Message history logic
    let initialMessages: any[] = [];
    const searchParams = await props.searchParams;
    const chatId = searchParams?.chatId;

    if (chatId) {
        const chatMessages = await db.query.messages.findMany({
            where: eq(messages.chatId, chatId as string),
            orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        });

        initialMessages = chatMessages.map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            experimental_attachments: msg.attachments as any, // Map back to experimental_attachments
            createdAt: msg.createdAt,
        }));
    } else {
        // New chat: Add welcome message (Localized)
        initialMessages = [{
            id: 'welcome-message',
            role: 'assistant',
            content: t('initial_message'),
            createdAt: new Date(),
        }];
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Navbar user={session.user} />
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between w-full px-2">
                    <div className="flex items-center gap-4">
                        <Link
                            href={session.user.role === 'STUDENT' ? '/student' : '/teacher'}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{assistant.name}</h1>
                            {assistant.description && (
                                <p className="text-sm text-gray-600">{assistant.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <ChatView
                assistantId={assistantId}
                chatId={chatId as string}
                initialMessages={initialMessages}
            />
        </div>
    );
}
