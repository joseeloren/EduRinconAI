import { auth } from '@/auth';
import { ChatInterface } from '@/components/chat/chat-interface';
import { db } from '@/db';
import { assistants, documents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default async function ChatPage({
    params,
}: {
    params: Promise<{ assistantId: string }>;
}) {
    const { assistantId } = await params;
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

    return (
        <div className="flex flex-col h-screen bg-gray-50">
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
                <ChatInterface assistantId={assistantId} />
            </div>
        </div>
    );
}
