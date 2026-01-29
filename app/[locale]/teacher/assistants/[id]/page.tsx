import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { assistants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssistantForm } from '@/components/assistants/assistant-form';
import { StudentAssignment } from '@/components/assistants/student-assignment';

import type { AssistantFormData } from '@/components/assistants/assistant-form';
import { Button } from '@/components/ui/button';
import { DeleteAssistantButton } from '@/components/assistants/delete-assistant-button';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { getTranslations } from 'next-intl/server';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function AssistantManagementPage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user || session.user.role === 'STUDENT') {
        redirect('/login');
    }

    const assistant = await db.query.assistants.findFirst({
        where: eq(assistants.id, id),
        with: {
            creator: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!assistant) {
        redirect('/teacher');
    }

    // Check permissions
    if (
        session.user.role !== 'ADMIN' &&
        assistant.createdById !== session.user.id
    ) {
        redirect('/teacher');
    }

    async function handleUpdateAssistant(data: AssistantFormData) {
        'use server';

        const session = await auth();
        if (!session?.user) {
            throw new Error('Not authenticated');
        }

        // Update assistant directly in database
        await db
            .update(assistants)
            .set({
                name: data.name,
                description: data.description,
                systemPrompt: data.systemPrompt,
                isPublic: data.isPublic ? 1 : 0,
                temperature: Math.round(data.temperature * 100),
            })
            .where(eq(assistants.id, id));

        redirect('/teacher');
    }

    async function handleDeleteAssistant() {
        'use server';

        const session = await auth();
        if (!session?.user) {
            throw new Error('Not authenticated');
        }

        // Delete assistant
        await db.delete(assistants).where(eq(assistants.id, id));

        redirect('/teacher');
    }

    const t = await getTranslations('assistantManagement');

    return (
        <>
            <Navbar user={session.user} />
            <div className="container max-w-6xl py-8 mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/teacher">
                        <Button variant="ghost" size="sm" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('backToDashboard')}
                        </Button>
                    </Link>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">{assistant.name}</h1>
                            {assistant.description && (
                                <p className="text-muted-foreground mt-2">{assistant.description}</p>
                            )}
                            <div className="mt-4 text-sm text-muted-foreground">
                                {t('createdBy')} {assistant.creator.name}
                            </div>
                        </div>
                        <DeleteAssistantButton
                            assistantId={assistant.id}
                            assistantName={assistant.name}
                            onDelete={handleDeleteAssistant}
                        />
                        <Link href={`/chat/${assistant.id}`}>
                            <Button variant="outline" size="sm" className="ml-2">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {t('testChat')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="info" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="info">{t('tabInfo')}</TabsTrigger>
                        <TabsTrigger value="students">{t('tabStudents')}</TabsTrigger>
                    </TabsList>

                    {/* Information Tab */}
                    <TabsContent value="info">
                        <div className="w-full">
                            <AssistantForm
                                initialData={{
                                    id: assistant.id,
                                    name: assistant.name,
                                    description: assistant.description || '',
                                    systemPrompt: assistant.systemPrompt,
                                    temperature: assistant.temperature / 100,
                                    isPublic: assistant.isPublic === 1,
                                }}
                                onSubmit={handleUpdateAssistant}
                                isEditing
                            />
                        </div>
                    </TabsContent>



                    {/* Students Tab */}
                    <TabsContent value="students">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('assignStudents')}</CardTitle>
                                <CardDescription>
                                    {t('assignDescription')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <StudentAssignment assistantId={id} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
