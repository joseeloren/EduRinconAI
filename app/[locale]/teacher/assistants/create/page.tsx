import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssistantForm } from '@/components/assistants/assistant-form';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { assistants } from '@/db/schema';
import type { AssistantFormData } from '@/components/assistants/assistant-form';
import { Navbar } from '@/components/ui/navbar';
import { getTranslations } from 'next-intl/server';

export default async function CreateAssistantPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'TEACHER') {
        redirect('/login');
    }

    const t = await getTranslations('createPage');

    async function handleCreateAssistant(data: AssistantFormData) {
        'use server';

        const session = await auth();
        if (!session?.user) {
            throw new Error('Not authenticated');
        }

        // Verify captcha if not in development or token provided
        if (data.captchaToken) {
            const { verifyCaptcha } = await import('@/lib/captcha');
            const isCaptchaValid = await verifyCaptcha(data.captchaToken);
            if (!isCaptchaValid) {
                throw new Error('Captcha inválido');
            }
        } else if (process.env.NODE_ENV === 'production') {
            // throw new Error('Captcha requerido');
        }

        // Create assistant directly in database
        const [assistant] = await db
            .insert(assistants)
            .values({
                name: data.name,
                description: data.description,
                systemPrompt: data.systemPrompt,
                createdById: session.user.id,
                isPublic: data.isPublic ? 1 : 0,
                temperature: Math.round(data.temperature * 100), // Convert to 0-100 scale
            })
            .returning();

        redirect('/teacher');
    }

    return (
        <>
            <Navbar user={session.user} />

            <div className="container max-w-4xl py-8 flex flex-col items-center mx-auto">
                <div className="mb-8 w-full">
                    <h1 className="text-3xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="w-full">
                    <AssistantForm onSubmit={handleCreateAssistant} />
                </div>
            </div>
        </>
    );
}
