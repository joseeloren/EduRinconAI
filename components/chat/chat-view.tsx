'use client';
import { useState } from 'react';
import { ChatInterface } from './chat-interface';
import { Avatar3DWrapper } from './avatar-scene';

interface ChatViewProps {
    assistantId: string;
    chatId?: string;
    initialMessages?: any[];
}

export function ChatView({ assistantId, chatId, initialMessages }: ChatViewProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);

    return (
        <div className="w-full h-full flex gap-4 items-stretch py-2 px-2">
            <main className="flex-1 min-h-0 flex flex-col">
                <ChatInterface
                    assistantId={assistantId}
                    chatId={chatId}
                    initialMessages={initialMessages}
                    onSpeakingChange={setIsSpeaking}
                />
            </main>

            <aside className="hidden lg:block w-[450px] shrink-0 h-full">
                <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
                    <Avatar3DWrapper isSpeaking={isSpeaking} />
                </div>
            </aside>
        </div>
    );
}
