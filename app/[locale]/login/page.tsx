'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Captcha } from '@/components/ui/captcha';

export default function LoginPage() {
    const t = useTranslations('Login');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

        if (!captchaToken && !isDebugMode) {
            setError('Por favor, completa el captcha');
            setLoading(false);
            return;
        }

        try {
            const result = await signIn('credentials', {
                email,
                password,
                captchaToken, // Pass captcha token to NextAuth
                redirect: false,
            });

            if (result?.error) {
                setError(t('invalidCredentials'));
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError(t('loginError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
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
                    <h2 className="text-xl font-semibold text-gray-800 mt-4">{t('title')}</h2>
                    <p className="text-sm text-gray-500">{t('subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Language Switcher */}
                    <div className="flex justify-end">
                        <LanguageSwitcher />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('email')}
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
                            {t('password')}
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

                    <Captcha onChange={setCaptchaToken} />

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
                        {loading ? t('loggingIn') : t('loginButton')}
                    </button>
                </form>

                {/* Quick Login Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm font-medium text-gray-700 mb-3">
                        {t('quickAccess')}
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
                            👤 {t('admin')}
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
                            👨‍🏫 {t('teacher')}
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
                            🎓 {t('student')}
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2">
                        {t('clickToFill')}
                    </p>
                </div>
            </div>
        </div>
    );
}
