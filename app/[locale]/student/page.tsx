import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { assistants, assistantAccess } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AssistantCard } from '@/components/assistants/assistant-card';
import { Bot } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { getTranslations } from 'next-intl/server';

export default async function StudentDashboard() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'STUDENT') {
        redirect('/login');
    }

    // Get assigned assistants for this student
    const assignments = await db.query.assistantAccess.findMany({
        where: eq(assistantAccess.userId, session.user.id),
        with: {
            assistant: true,
        },
    });

    // Get public assistants
    const publicAssistants = await db.query.assistants.findMany({
        where: eq(assistants.isPublic, 1),
    });

    // Combine and deduplicate
    const assignedAssistants = assignments.map((a) => a.assistant);
    const publicAssistantIds = new Set(publicAssistants.map((a) => a.id));
    const assignedIds = new Set(assignedAssistants.map((a) => a.id));

    const uniquePublic = publicAssistants.filter((a) => !assignedIds.has(a.id));
    const allAssistants = [...assignedAssistants, ...uniquePublic];

    const t = await getTranslations();

    return (
        <>
            <Navbar user={session.user} />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">
                            {t('student.title')}
                        </h1>
                        <p className="text-gray-600">
                            {t('student.subtitle')}
                        </p>
                    </div>

                    {/* Assistants Grid */}
                    {allAssistants.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                            <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {t('student.noAssistants')}
                            </h3>
                            <p className="text-gray-600">
                                {t('student.contactTeacher')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {assignedAssistants.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                        {t('student.assigned')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {assignedAssistants.map((assistant) => (
                                            <AssistantCard
                                                key={assistant.id}
                                                assistant={assistant}
                                                userRole="STUDENT"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {uniquePublic.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                        {t('student.public')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {uniquePublic.map((assistant) => (
                                            <AssistantCard
                                                key={assistant.id}
                                                assistant={assistant}
                                                userRole="STUDENT"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
