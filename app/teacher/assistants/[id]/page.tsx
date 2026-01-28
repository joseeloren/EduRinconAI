import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { assistants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssistantForm } from '@/components/assistants/assistant-form';
import { StudentAssignment } from '@/components/assistants/student-assignment';
import { DocumentList } from '@/components/documents/document-list';
import { UploadZone } from '@/components/documents/upload-zone';
import type { AssistantFormData } from '@/components/assistants/assistant-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    params: {
        id: string;
    };
}

export default async function AssistantManagementPage({ params }: PageProps) {
    const session = await auth();

    if (!session?.user || session.user.role === 'STUDENT') {
        redirect('/login');
    }

    const assistant = await db.query.assistants.findFirst({
        where: eq(assistants.id, params.id),
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

        const response = await fetch(
            `${process.env.NEXTAUTH_URL}/api/assistants/${params.id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    temperature: Math.round(data.temperature * 100),
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to update assistant');
        }

        redirect(`/teacher/assistants/${params.id}`);
    }

    return (
        <div className="container max-w-6xl py-8">
            {/* Header */}
            <div className="mb-8">
                <Link href="/teacher">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al Dashboard
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">{assistant.name}</h1>
                {assistant.description && (
                    <p className="text-muted-foreground mt-2">{assistant.description}</p>
                )}
                <div className="mt-4 text-sm text-muted-foreground">
                    Creado por {assistant.creator.name}
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">Información</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                    <TabsTrigger value="students">Estudiantes</TabsTrigger>
                </TabsList>

                {/* Information Tab */}
                <TabsContent value="info">
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
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subir Documentos</CardTitle>
                            <CardDescription>
                                Los documentos se procesarán automáticamente para mejorar las
                                respuestas del asistente mediante RAG
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UploadZone assistantId={params.id} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Documentos Subidos</CardTitle>
                            <CardDescription>
                                Gestiona los documentos asociados a este asistente
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DocumentList assistantId={params.id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Students Tab */}
                <TabsContent value="students">
                    <Card>
                        <CardHeader>
                            <CardTitle>Asignar Estudiantes</CardTitle>
                            <CardDescription>
                                Controla qué estudiantes tienen acceso a este asistente
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StudentAssignment assistantId={params.id} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
