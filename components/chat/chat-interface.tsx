'use client';

import { useChat } from 'ai/react';
import { Send, FileText, Volume2, Mic, MicOff, Image as ImageIcon, X } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { useRef, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

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
    const locale = useLocale();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { messages, input, handleInputChange, handleSubmit, isLoading, append, setInput } = useChat({
        api: '/api/chat',
        initialMessages,
        body: {
            assistantId,
            chatId,
        },
        onError: (error) => {
            console.error('Chat error:', error);
            try {
                const errorMessage = error.message;
                try {
                    const parsed = JSON.parse(errorMessage);
                    if (parsed && parsed.details) {
                        setErrorMsg(parsed.details);
                        return;
                    }
                } catch (e) { }
                setErrorMsg(errorMessage || 'Ha ocurrido un error al procesar tu solicitud.');
            } catch (e) {
                setErrorMsg('Ha ocurrido un error inesperado.');
            }
        },
    });

    // TTS Hooks & State DECLARATIONS FIRST
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const mountedRef = useRef(false);
    const [audioBlocked, setAudioBlocked] = useState(false);

    // STT State
    const [isListening, setIsListening] = useState(false);
    const [autoSend, setAutoSend] = useState(false); // New Auto-send state
    const recognitionRef = useRef<any>(null);

    // Vision / Attachments State
    const [files, setFiles] = useState<FileList | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize SpeechSynthesis
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                if (availableVoices.length > 0) setVoices(availableVoices);
            };
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
            return () => {
                window.speechSynthesis.onvoiceschanged = null;
                if (synthRef.current) synthRef.current.cancel();
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert(t('browserNotSupported') || "Tu navegador no soporta entrada de voz.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = locale === 'en' ? 'en-US' : 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;

            if (autoSend) {
                // Determine if we append to existing input or send strictly the voice
                // Usually auto-send implies "Send what I just said"
                // If there was text in input, we might want to preserve it or append?
                // For simplicity: If autoSend, we append the transcript immediately as a message
                append({
                    role: 'user',
                    content: input ? input + ' ' + transcript : transcript
                });
                setInput(''); // Clear input after auto-send
            } else {
                const newValue = input ? input + ' ' + transcript : transcript;
                handleInputChange({ target: { value: newValue } } as any);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(event.target.files);
        }
    };

    const clearFiles = () => {
        setFiles(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Helper to play audio (DEFINED AFTER HOOKS)
    const playAudio = (text: string) => {
        if (!synthRef.current || voices.length === 0) return;

        synthRef.current.cancel();
        setAudioBlocked(false);

        const cleanText = text.replace(/[*#_`]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);

        const langTag = locale === 'en' ? 'en-US' : 'es-ES';

        // Helper to find the best voice based on quality keywords and male preference
        const getBestVoice = (langCode: string) => {
            const availableVoices = voices.filter(v => v.lang.includes(langCode));

            // Common male name patterns in Spanish and English
            const maleNames = ['David', 'Mark', 'Male', 'Alvaro', 'Jorge', 'Enrique', 'Julian', 'Pablo', 'Diego', 'Manuel', 'Guy', 'James', 'Andrew'];

            // Priority 1: Neural/Online/Natural MALE voices
            const premiumMaleVoice = availableVoices.find(v =>
                (v.name.includes('Online') || v.name.includes('Neural') || v.name.includes('Natural')) &&
                maleNames.some(name => v.name.includes(name))
            );
            if (premiumMaleVoice) return premiumMaleVoice;

            // Priority 2: Any MALE voice
            const anyMaleVoice = availableVoices.find(v =>
                maleNames.some(name => v.name.includes(name))
            );
            if (anyMaleVoice) return anyMaleVoice;

            // Priority 3: Any Neural/Online voice (if no male voice found)
            const premiumVoice = availableVoices.find(v =>
                v.name.includes('Online') || v.name.includes('Neural') || v.name.includes('Natural')
            );
            if (premiumVoice) return premiumVoice;

            // Priority 4: Any matching language
            return availableVoices[0];
        };

        const preferredVoice = getBestVoice(locale === 'en' ? 'en' : 'es');

        if (preferredVoice) {
            console.log(`[TTS] Selected Voice: ${preferredVoice.name} (${preferredVoice.lang})`);
            utterance.voice = preferredVoice;
        }

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
            if (e.error === 'not-allowed') setAudioBlocked(true);
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

                            {/* Render attachments if present */}
                            {message.experimental_attachments && message.experimental_attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {message.experimental_attachments.map((attachment, index) => (
                                            attachment.contentType?.startsWith('image/') && (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={attachment.url}
                                                        alt={attachment.name || 'Attachment'}
                                                        className="max-w-[200px] max-h-[200px] rounded-md border border-white/20 shadow-sm"
                                                    />
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

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
            <div className="border-t border-gray-200 p-4 bg-white flex flex-col gap-2">

                {/* Auto-send Toggle & Previews */}
                <div className="flex flex-col gap-2">
                    {files && files.length > 0 && (
                        <div className="flex gap-2 px-2 overflow-x-auto">
                            {Array.from(files).map((file, i) => (
                                <div key={i} className="relative group">
                                    <div className="w-16 h-16 rounded-md border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="preview"
                                            className="w-full h-full object-cover"
                                            onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                        />
                                    </div>
                                    <button
                                        onClick={clearFiles}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                                        type="button"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-end px-2 gap-2 text-xs text-gray-500">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
                            <input
                                type="checkbox"
                                checked={autoSend}
                                onChange={(e) => setAutoSend(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                            />
                            <span>{locale === 'en' ? 'Auto-send voice' : 'Enviar voz automáticamente'}</span>
                        </label>
                    </div>
                </div>

                <form
                    onSubmit={async (event) => {
                        event.preventDefault();
                        const attachments = files ? Array.from(files) : [];

                        if (attachments.length > 0 && !input.trim()) {
                            setErrorMsg(t('image_requires_text'));
                            return;
                        }

                        console.log('[Chat Client] Submitting form. Attachments length:', attachments.length);

                        // Convert files to Base64 to ensure they are sent correctly in the JSON payload
                        const attachmentsData = await Promise.all(
                            attachments.map(async (file) => {
                                return new Promise<any>((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve({
                                        name: file.name,
                                        contentType: file.type,
                                        url: reader.result as string
                                    });
                                    reader.readAsDataURL(file);
                                });
                            })
                        );

                        handleSubmit(event, {
                            experimental_attachments: attachmentsData
                        });
                        console.log('[Chat Client] handleSubmit called with Base64 attachments');

                        setFiles(undefined);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="flex gap-2"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                        title="Subir imagen"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>

                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-2 rounded-full transition-all ${isListening
                            ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        title={isListening ? "Detener" : "Dictar"}
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder={isListening ? (locale === 'en' ? 'Listening...' : 'Escuchando...') : t('placeholder')}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || (!input.trim() && (!files || files.length === 0))}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
