'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TalkingAvatarProps {
    text: string;
    autoPlay?: boolean;
    avatarSrc?: string;
    language?: string;
}

export function TalkingAvatar({
    text,
    autoPlay = false,
    avatarSrc = '/avatars/ai_assistant_avatar.png',
    language = 'es-ES'
}: TalkingAvatarProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(!autoPlay);
    const [audioSupported, setAudioSupported] = useState(true);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        } else {
            setAudioSupported(false);
        }

        return () => {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Effect to handle text changes
    useEffect(() => {
        if (!text || isMuted || !synthRef.current) return;

        // Cancel previous speech if new text arrives (or just queue it? Let's cancel for immediate feedback)
        synthRef.current.cancel();

        speak(text);
    }, [text, isMuted]);

    const speak = (textToSpeak: string) => {
        if (!synthRef.current) return;

        // Clean text from markdown symbols for better reading
        const cleanText = textToSpeak.replace(/[*#_`]/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = language;

        // Try to select a good voice
        const voices = synthRef.current.getVoices();

        const getBestVoice = (langCode: string) => {
            const availableVoices = voices.filter(v => v.lang.includes(langCode));
            const maleNames = [
                'Alvaro', 'Jorge', 'Julian', 'Diego', 'Manuel', 'Dario', 'Elias', 'Victor', 'Pedro', 'Mateo', 'David', 'Mark', 'Male', 'Guy', 'James', 'Andrew', 'Enrique', 'Pablo',
                'Arthur', 'Daniel', 'Richard', 'Thomas', 'Oliver', 'Microsoft David', 'Google US English Male'
            ];

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

            // Priority 3: Any Neural/Online voice
            const premiumVoice = availableVoices.find(v =>
                v.name.includes('Online') || v.name.includes('Neural') || v.name.includes('Natural')
            );
            if (premiumVoice) return premiumVoice;

            return availableVoices[0];
        };

        const preferredVoice = getBestVoice(language.split('-')[0]);

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        utteranceRef.current = utterance;
        synthRef.current.speak(utterance);
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);

        if (newMuted) {
            synthRef.current?.cancel();
            setIsSpeaking(false);
        } else {
            // Re-speak current text if unmuted
            if (text) speak(text);
        }
    };

    if (!audioSupported) return null;

    return (
        <div className="relative group inline-block">
            <div className={`
                relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 transition-all duration-300
                ${isSpeaking
                    ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-110'
                    : 'border-gray-200 hover:border-blue-300'
                }
            `}>
                <Image
                    src={avatarSrc}
                    alt="AI Avatar"
                    fill
                    className={`object-cover transition-transform duration-200 ${isSpeaking ? 'animate-pulse-subtle' : ''}`}
                    onError={(e) => {
                        // Fallback using Boring Avatars source or similar if local image fails
                        const target = e.target as HTMLImageElement;
                        target.src = `https://source.boringavatars.com/beam/120/EduRinconAI?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
                    }}
                />

                {/* Visualizer Overlay */}
                {isSpeaking && (
                    <div className="absolute inset-0 bg-black/10 flex items-end justify-center gap-[2px] pb-2">
                        <div className="w-1 bg-white animate-[bounce_0.8s_infinite] h-3 rounded-full opacity-80"></div>
                        <div className="w-1 bg-white animate-[bounce_1.2s_infinite] h-5 rounded-full opacity-80"></div>
                        <div className="w-1 bg-white animate-[bounce_0.5s_infinite] h-2 rounded-full opacity-80"></div>
                    </div>
                )}
            </div>

            <Button
                variant="outline"
                size="icon"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center p-0"
                onClick={toggleMute}
                title={isMuted ? "Activar voz" : "Silenciar"}
            >
                {isMuted ? (
                    <VolumeX className="w-3 h-3 text-gray-500" />
                ) : (
                    <Volume2 className={`w-3 h-3 ${isSpeaking ? 'text-blue-500' : 'text-gray-700'}`} />
                )}
            </Button>

            <style jsx global>{`
                @keyframes pulse-subtle {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.05); filter: brightness(1.1); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
