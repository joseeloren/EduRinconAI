import { auth } from '@/auth';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Navbar } from '@/components/ui/navbar';
import { db } from '@/db';
import { assistants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

import { messages } from '@/db/schema';

export default async function ChatPage(props: {
    params: Promise<{ assistantId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await props.params;
    const { assistantId } = params;
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

    const assistantDocuments = await db
        .select()
        .from(documents)
        .where(eq(documents.assistantId, assistantId));

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
            sources: msg.sources,
        }));
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Navbar user={session.user} />
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
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

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{assistantDocuments.length} documentos</span>
                    </div>
                </div>
            </header>

            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
                <div className="container max-w-4xl mx-auto h-full flex flex-col py-4">
                    <ChatInterface
                        assistantId={assistantId}
                        chatId={chatId as string}
                        initialMessages={initialMessages}
                    />
                </div>
            </div>
        </div>
    );
}
