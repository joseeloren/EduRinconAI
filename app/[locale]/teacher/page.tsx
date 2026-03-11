import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { assistants } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { AssistantCard } from '@/components/assistants/assistant-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, BookOpen, Users, Bot } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { getTranslations } from 'next-intl/server';

export default async function TeacherDashboard() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'TEACHER') {
        redirect('/login');
    }

    // Get teacher's assistants
    const assistantsList = await db.query.assistants.findMany({
        where: eq(assistants.createdById, session.user.id),
        orderBy: (assistants, { desc }) => [desc(assistants.createdAt)],
    });

    // Get document counts for each assistant
    const teacherAssistants = assistantsList.map(assistant => ({
        ...assistant,
        documentCount: 0 // Hardcoded to 0 since documents feature is removed
    }));

    const t = await getTranslations();

    return (
        <>
            <Navbar user={session.user} />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">
                                {t('teacher.title')}
                            </h1>
                            <p className="text-gray-600">{t('teacher.subtitle')}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/teacher/assistants/create">
                                <Button className="w-full">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('teacher.createNewAssistant')}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Assistants Grid */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {t('teacher.myAssistants')}
                        </h2>


                        {teacherAssistants.length === 0 ? (
                            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                                <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {t('teacher.noAssistants')}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {t('teacher.createFirstAssistant')}
                                </p>
                                <Link href="/teacher/assistants/create">
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('teacher.createAssistant')}
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {teacherAssistants.map((assistant) => (
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
            </div >
        </>
    );
}
