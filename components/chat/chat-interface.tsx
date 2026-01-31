'use client';

import { useChat } from 'ai/react';
import { Send, FileText, Volume2 } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ChatInterfaceProps {
    assistantId: string;
    chatId?: string;
    initialMessages?: Array<{
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
    onSpeakingChange?: (isSpeaking: boolean) => void;
}

export function ChatInterface({ assistantId, chatId, initialMessages = [], onSpeakingChange }: ChatInterfaceProps) {
    const t = useTranslations('chat');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        initialMessages,
        body: {
            assistantId,
            chatId,
        },
        onError: (error) => {
            console.error('Chat error:', error);
            try {
                // Intenta parsear el error si viene como JSON string en el mensaje
                const errorMessage = error.message;
                try {
                    const parsed = JSON.parse(errorMessage);
                    if (parsed && parsed.details) {
                        setErrorMsg(parsed.details);
                        return;
                    }
                } catch (e) { }

                // Fallback para mensajes estándar
                setErrorMsg(errorMessage || 'Ha ocurrido un error al procesar tu solicitud.');
            } catch (e) {
                setErrorMsg('Ha ocurrido un error inesperado.');
            }
        },
    });

    // TTS State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const mountedRef = useRef(false);

    // Initialize SpeechSynthesis and load voices
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;

            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                if (availableVoices.length > 0) {
                    setVoices(availableVoices);
                }
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;

            return () => {
                window.speechSynthesis.onvoiceschanged = null;
                if (synthRef.current) {
                    synthRef.current.cancel();
                }
            };
        }
    }, []);

    const [audioBlocked, setAudioBlocked] = useState(false);

    // Helper to play audio
    const playAudio = (text: string) => {
        if (!synthRef.current || voices.length === 0) return;

        synthRef.current.cancel();
        setAudioBlocked(false); // Reset blocked state on new attempt

        const cleanText = text.replace(/[*#_`]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';

        // Select best voice
        const preferredVoice = voices.find(v => v.lang.includes('es') && v.name.includes('Google')) ||
            voices.find(v => v.lang.includes('es') && v.name.includes('Microsoft')) ||
            voices.find(v => v.lang.includes('es'));

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
            setIsSpeaking(true);
            onSpeakingChange?.(true);
            setAudioBlocked(false);
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            onSpeakingChange?.(false);
        };
        utterance.onerror = (e) => {
            console.error('TTS Error:', e);
            setIsSpeaking(false);
            onSpeakingChange?.(false);

            if (e.error === 'not-allowed') {
                setAudioBlocked(true);
            }
        };

        synthRef.current.speak(utterance);
    };

    // Get the last assistant message object
    const lastAssistantMessage = messages
        .filter(m => m.role === 'assistant')
        .pop();

    const lastReadMessageId = useRef<string | null>(null);

    // Retry handler for blocked audio
    const handleRetryAudio = () => {
        if (lastAssistantMessage) {
            playAudio(lastAssistantMessage.content);
        }
    };

    // Handle TTS when new message arrives
    useEffect(() => {
        if (!lastAssistantMessage || !synthRef.current || voices.length === 0) return;

        // Logic to prevent reading old history on page load, 
        // BUT allow reading the "Welcome Message" (which is technically history/initial).
        const isWelcomeMessage = lastAssistantMessage.id === 'welcome-message';
        const isNewMessage = mountedRef.current; // If we are already mounted, any change is a new message

        if (!isNewMessage && !isWelcomeMessage) {
            // It's page load, and it's NOT a welcome message -> It's just history. Don't speak.
            mountedRef.current = true;
            return;
        }

        mountedRef.current = true;

        // Case 1: Welcome Message with blocked auto-play handling
        if (lastAssistantMessage.id === 'welcome-message') {
            if (lastReadMessageId.current !== lastAssistantMessage.id) {
                lastReadMessageId.current = lastAssistantMessage.id;
                setTimeout(() => playAudio(lastAssistantMessage.content), 1000);
            }
            return;
        }

        // Case 2: Generated Messages
        if (!isLoading && lastAssistantMessage.id !== lastReadMessageId.current) {
            lastReadMessageId.current = lastAssistantMessage.id;
            playAudio(lastAssistantMessage.content);
        }

    }, [lastAssistantMessage, isLoading, voices]); // Removed onSpeakingChange to avoid cycles

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col flex-1 min-h-0">

            {/* Messages Container */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {audioBlocked && (
                    <div
                        className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={handleRetryAudio}
                    >
                        <div className="flex items-center">
                            <Volume2 className="h-5 w-5 text-blue-500 mr-2" />
                            <p className="text-sm text-blue-700 font-medium">
                                El navegador ha bloqueado el audio automático. Haz clic aquí para activar la voz del profesor.
                            </p>
                        </div>
                    </div>
                )}

                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <p className="text-lg">{t('welcome')}</p>
                        <p className="text-sm mt-2">{t('instructions')}</p>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[90%] rounded-lg px-4 py-2 ${message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                                }`}
                        >
                            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                                <MarkdownRenderer content={message.content} />
                            </div>

                            {/* Show sources if available */}
                            {message.role === 'assistant' && (message as any).sources && (
                                <div className="mt-2 pt-2 border-t border-gray-300">
                                    <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {t('sources')}
                                    </p>
                                    <ul className="text-xs space-y-1">
                                        {(message as any).sources.map((source: any, idx: number) => (
                                            <li key={idx} className="truncate">
                                                • {source.documentName} ({Math.round(source.similarity * 100)}%)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Replay Button for Assistant Messages */}
                            {message.role === 'assistant' && (
                                <div className="mt-1 flex justify-end">
                                    <button
                                        onClick={() => playAudio(message.content)}
                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Leer en voz alta"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}

                {errorMsg && (
                    <div className="flex justify-center my-4">
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-[90%] text-sm" role="alert">
                            <strong className="font-bold block mb-1">Error:</strong>
                            <span className="block sm:inline">{errorMsg}</span>
                            <button
                                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                                onClick={() => setErrorMsg(null)}
                            >
                                <span className="fill-current h-6 w-6 text-red-500 font-bold">×</span>
                            </button>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder={t('placeholder')}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
