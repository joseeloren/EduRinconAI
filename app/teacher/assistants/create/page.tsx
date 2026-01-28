import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssistantForm } from '@/components/assistants/assistant-form';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import type { AssistantFormData } from '@/components/assistants/assistant-form';

export default async function CreateAssistantPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'TEACHER') {
        redirect('/login');
    }

    async function handleCreateAssistant(data: AssistantFormData) {
        'use server';

        const session = await auth();
        if (!session?.user) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/assistants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                temperature: Math.round(data.temperature * 100), // Convert to 0-100 scale
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create assistant');
        }

        const assistant = await response.json();
        redirect(`/teacher/assistants/${assistant.id}`);
    }

    return (
        <div className="container max-w-4xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Crear Nuevo Asistente</h1>
                <p className="text-muted-foreground mt-2">
                    Personaliza un asistente de IA para tus estudiantes
                </p>
            </div>

            <AssistantForm onSubmit={handleCreateAssistant} />
        </div>
    );
}
