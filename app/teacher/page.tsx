import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { assistants, documents } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { AssistantCard } from '@/components/assistants/assistant-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, BookOpen, Users, Bot } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';

export default async function TeacherDashboard() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'TEACHER') {
        redirect('/login');
    }

    // Get teacher's assistants
    const teacherAssistants = await db.query.assistants.findMany({
        where: eq(assistants.createdById, session.user.id),
        orderBy: (assistants, { desc }) => [desc(assistants.createdAt)],
    });

    // Get document counts for each assistant
    const assistantsWithCounts = await Promise.all(
        teacherAssistants.map(async (assistant) => {
            const [{ count: docCount }] = await db
                .select({ count: count() })
                .from(documents)
                .where(eq(documents.assistantId, assistant.id));

            return {
                ...assistant,
                documentCount: docCount,
            };
        })
    );

    return (
        <>
            <Navbar user={session.user} />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">
                                Dashboard del Profesor
                            </h1>
                            <p className="text-gray-600">Gestiona tus asistentes y recursos</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/teacher/assistants/create">
                                <Button className="w-full">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear Nuevo Asistente
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Bot className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Asistentes</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {teacherAssistants.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Documentos</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {assistantsWithCounts.reduce((sum, a) => sum + a.documentCount, 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Estudiantes</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {/* TODO: Count unique students assigned */}
                                        -
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assistants Grid */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Mis Asistentes
                        </h2>

                        {assistantsWithCounts.length === 0 ? (
                            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                                <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No tienes asistentes aún
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Crea tu primer asistente para comenzar
                                </p>
                                <Link href="/teacher/assistants/create">
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Crear Asistente
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assistantsWithCounts.map((assistant) => (
                                    <AssistantCard
                                        key={assistant.id}
                                        assistant={assistant}
                                        documentCount={assistant.documentCount}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
