import { useState } from 'react';
import { ChatInterface } from './chat-interface';
import { Avatar3DWrapper } from './avatar-scene';
import Link from 'next/link';
import { ArrowLeft, Share2, Check } from 'lucide-react';
import { useLocale } from 'next-intl';

interface ChatViewProps {
    assistantId: string;
    assistantName: string;
    assistantDescription?: string | null;
    chatId?: string;
    initialMessages?: any[];
    readOnly?: boolean;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export function ChatView({ assistantId, assistantName, assistantDescription, chatId, initialMessages, readOnly = false, role }: ChatViewProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const locale = useLocale();

    const handleShare = async () => {
        if (!chatId) return;
        setIsSharing(true);
        try {
            await fetch(`/api/chat/${chatId}/share`, {
                method: 'POST',
                body: JSON.stringify({ isPublic: true }),
            });
            const url = `${window.location.origin}/${locale}/share/${chatId}`;
            await navigator.clipboard.writeText(url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to share:', err);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header */}
            {!readOnly && (
                <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center gap-4">
                            <Link
                                href={role === 'STUDENT' ? '/student' : '/teacher'}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    {assistantName}
                                    {chatId && (
                                        <button
                                            onClick={handleShare}
                                            disabled={isSharing}
                                            className="ml-2 p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100"
                                            title={isCopied ? "Enlace copiado" : "Compartir chat"}
                                        >
                                            {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                                        </button>
                                    )}
                                </h1>
                                {assistantDescription && (
                                    <p className="text-sm text-gray-600">{assistantDescription}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
            )}

            <div className="flex-1 min-h-0 flex gap-4 items-stretch py-2 px-2 overflow-hidden">
                <main className="flex-1 min-h-0 flex flex-col">
                    <ChatInterface
                        assistantId={assistantId}
                        chatId={chatId}
                        initialMessages={initialMessages}
                        onSpeakingChange={setIsSpeaking}
                        readOnly={readOnly}
                    />
                </main>

                <aside className="hidden lg:block w-[450px] shrink-0 h-full">
                    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
                        <Avatar3DWrapper isSpeaking={isSpeaking} />
                    </div>
                </aside>
            </div>
        </div>
    );
}
