'use client';

import { useChat } from 'ai/react';
import { Send, FileText } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { useEffect, useRef } from 'react';

interface ChatInterfaceProps {
    assistantId: string;
    chatId?: string;
}

export function ChatInterface({ assistantId, chatId }: ChatInterfaceProps) {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        body: {
            assistantId,
            chatId,
        },
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <p className="text-lg">👋 ¡Hola! ¿En qué puedo ayudarte hoy?</p>
                        <p className="text-sm mt-2">Escribe tu pregunta y presiona Enter</p>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user'
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
                                        Fuentes:
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

                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Escribe tu pregunta..."
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
