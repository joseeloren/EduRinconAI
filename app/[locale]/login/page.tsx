'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function LoginPage() {
    const t = useTranslations('Login');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        // ... (existing logic)
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Credenciales inválidas'); // TODO: Translate error messages
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/logo-mentorai.png"
                            alt="MentorAI"
                            width={120}
                            height={120}
                            className="rounded-lg"
                            unoptimized
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">MentorAI</h1>
                    <p className="text-gray-600 mt-2">Tu asistente educativo inteligente</p>
                    <h2 className="text-xl font-semibold text-gray-800 mt-4">{t('title')}</h2>
                    <p className="text-sm text-gray-500">{t('subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </button>
                </form>

                {/* Quick Login Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm font-medium text-gray-700 mb-3">
                        Acceso Rápido (Testing)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('admin@iesrincon.es');
                                setPassword('password');
                            }}
                            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            disabled={loading}
                        >
                            👤 Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('teacher@iesrincon.es');
                                setPassword('password');
                            }}
                            className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                            disabled={loading}
                        >
                            👨‍🏫 Profesor
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('student@iesrincon.es');
                                setPassword('password');
                            }}
                            className="px-3 py-2 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                            disabled={loading}
                        >
                            🎓 Alumno
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2">
                        Click para auto-completar credenciales
                    </p>
                </div>
            </div>
        </div>
    );
}
