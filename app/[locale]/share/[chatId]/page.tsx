import { db } from "@/db";
import { chats, messages, assistants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";
import { Navbar } from "@/components/ui/navbar";
import { getTranslations } from "next-intl/server";

export default async function SharedChatPage({
    params,
}: {
    params: Promise<{ chatId: string; locale: string }>;
}) {
    const { chatId, locale } = await params;
    const t = await getTranslations({ locale, namespace: "chat" });

    const [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

    if (!chat || chat.isPublic === 0) {
        notFound();
    }

    const [assistant] = await db
        .select()
        .from(assistants)
        .where(eq(assistants.id, chat.assistantId))
        .limit(1);

    const chatMessages = await db.query.messages.findMany({
        where: eq(messages.chatId, chatId),
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });

    const initialMessages = [
        {
            id: 'welcome-message',
            role: 'assistant',
            content: t('initial_message'),
            createdAt: chat.createdAt,
        },
        ...chatMessages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            experimental_attachments: msg.attachments as any,
            createdAt: msg.createdAt,
        }))
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Navbar user={null} />
            <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between w-full px-2">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {assistant?.name}
                        </h1>
                        <p className="text-sm text-gray-500 italic">
                            {locale === "en" ? "Shared conversation" : "Conversación compartida"}
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-hidden relative">
                <ChatView
                    assistantId={chat.assistantId}
                    assistantName={assistant?.name || ''}
                    assistantDescription={assistant?.description}
                    chatId={chatId}
                    initialMessages={initialMessages}
                    readOnly={true}
                    role="STUDENT"
                />
                <div className="absolute inset-0 z-50 pointer-events-none flex items-end justify-center pb-20">
                    <div className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg pointer-events-auto">
                        {locale === "en"
                            ? "This is a read-only shared chat"
                            : "Esta es una conversación compartida de solo lectura"}
                    </div>
                </div>
            </div>
        </div>
    );
}
