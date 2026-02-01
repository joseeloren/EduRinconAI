'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle2, XCircle, Loader2, Trophy, ArrowRight, RefreshCw } from 'lucide-react';
import { useLocale } from 'next-intl';

interface Question {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

interface QuizModalProps {
    chatId: string;
    onClose: () => void;
}

export function QuizModal({ chatId, onClose }: QuizModalProps) {
    const [quiz, setQuiz] = useState<Question[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const locale = useLocale();

    const fetchQuiz = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/chat/${chatId}/quiz`);
            if (!res.ok) throw new Error('Failed to generate quiz');
            const data = await res.json();
            setQuiz(data);
        } catch (err) {
            setError(locale === 'en' ? 'Could not generate quiz. Try talking more first!' : 'No se pudo generar el quiz. ¡Intenta hablar más primero!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuiz();
    }, [chatId]);

    const handleOptionSelect = (index: number) => {
        if (showFeedback) return;
        setSelectedOption(index);
        setShowFeedback(true);
        if (index === quiz![currentIndex].correctAnswerIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < quiz!.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowFeedback(false);
        } else {
            setQuizCompleted(true);
        }
    };

    const resetQuiz = () => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setShowFeedback(false);
        setScore(0);
        setQuizCompleted(false);
        fetchQuiz();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-2xl shadow-2xl overflow-hidden border-none bg-white">
                <CardHeader className="bg-blue-600 text-white flex flex-row items-center justify-between py-4">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-6 h-6" />
                        <CardTitle className="text-xl">
                            {locale === 'en' ? 'Quick Review Quiz' : 'Test de Repaso Rápido'}
                        </CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                        <X className="w-6 h-6" />
                    </Button>
                </CardHeader>

                <CardContent className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                            <p className="text-gray-600 font-medium italic">
                                {locale === 'en' ? 'Analyzing conversation and creating questions...' : 'Analizando la conversación y creando preguntas...'}
                            </p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500 mb-6 font-medium">{error}</p>
                            <Button onClick={fetchQuiz} variant="outline" className="gap-2">
                                <RefreshCw className="w-4 h-4" /> {locale === 'en' ? 'Try Again' : 'Reintentar'}
                            </Button>
                        </div>
                    ) : quizCompleted ? (
                        <div className="text-center py-8">
                            <Badge variant="secondary" className="mb-4 px-4 py-1 text-lg bg-blue-100 text-blue-700">
                                {locale === 'en' ? 'Completed!' : '¡Completado!'}
                            </Badge>
                            <h2 className="text-4xl font-bold mb-2">
                                {score} / {quiz?.length}
                            </h2>
                            <p className="text-gray-500 mb-8 italic">
                                {score === quiz?.length
                                    ? (locale === 'en' ? 'Perfect! You mastered this topic.' : '¡Perfecto! Has dominado este tema.')
                                    : (locale === 'en' ? 'Good effort! Keep practicing.' : '¡Buen esfuerzo! Sigue practicando.')}
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button onClick={resetQuiz} variant="outline" className="gap-2">
                                    <RefreshCw className="w-4 h-4" /> {locale === 'en' ? 'Restart' : 'Reiniciar'}
                                </Button>
                                <Button onClick={onClose} className="gap-2">
                                    {locale === 'en' ? 'Back to Chat' : 'Volver al Chat'}
                                </Button>
                            </div>
                        </div>
                    ) : quiz ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                                    {locale === 'en' ? `Question ${currentIndex + 1} of ${quiz.length}` : `Pregunta ${currentIndex + 1} de ${quiz.length}`}
                                </span>
                                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-500"
                                        style={{ width: `${((currentIndex + 1) / quiz.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold mb-8 text-gray-800 leading-relaxed">
                                {quiz[currentIndex].question}
                            </h3>

                            <div className="grid gap-3">
                                {quiz[currentIndex].options.map((option, idx) => {
                                    const isCorrect = idx === quiz[currentIndex].correctAnswerIndex;
                                    const isSelected = idx === selectedOption;

                                    let variant: "outline" | "default" | "secondary" = "outline";
                                    let className = "py-4 px-6 text-left h-auto text-base transition-all duration-200 border-2 ";

                                    if (showFeedback) {
                                        if (isCorrect) className += "bg-green-50 border-green-500 text-green-700 font-bold ";
                                        else if (isSelected) className += "bg-red-50 border-red-500 text-red-700 ";
                                        else className += "opacity-50 ";
                                    } else {
                                        className += "hover:border-blue-400 hover:bg-blue-50";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionSelect(idx)}
                                            disabled={showFeedback}
                                            className={className + " rounded-xl flex items-center justify-between"}
                                        >
                                            <span>{option}</span>
                                            {showFeedback && (
                                                isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                                                    isSelected ? <XCircle className="w-5 h-5 text-red-600" /> : null
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {showFeedback && (
                                <div className="mt-8 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500 animate-in fade-in duration-500">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        <span className="font-bold text-blue-700 mr-2">
                                            {locale === 'en' ? 'Explanation:' : 'Explicación:'}
                                        </span>
                                        {quiz[currentIndex].explanation}
                                    </p>
                                    <div className="flex justify-end mt-4">
                                        <Button onClick={handleNext} className="gap-2">
                                            {currentIndex === quiz.length - 1
                                                ? (locale === 'en' ? 'Show Results' : 'Ver Resultados')
                                                : (locale === 'en' ? 'Next Question' : 'Siguiente Pregunta')}
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
