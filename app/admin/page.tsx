import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, assistants, documents } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { Users, Bot, FileText, GraduationCap } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';

export default async function AdminDashboard() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/login');
    }

    // Get statistics
    const [
        { count: totalUsers }
    ] = await db.select({ count: count() }).from(users);

    const [
        { count: totalAssistants }
    ] = await db.select({ count: count() }).from(assistants);

    const [
        { count: totalDocuments }
    ] = await db.select({ count: count() }).from(documents);

    // Get recent users
    const recentUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)],
        limit: 5,
        columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });

    return (
        <>
            <Navbar user={session.user} />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">
                            Panel de Administración
                        </h1>
                        <p className="text-gray-600">Gestiona usuarios y recursos del sistema</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Usuarios</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Bot className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Asistentes</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalAssistants}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <FileText className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Documentos</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <GraduationCap className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Sistema</p>
                                    <p className="text-sm font-bold text-gray-900">Activo</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Users */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Usuarios Recientes
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {recentUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-blue-600 font-medium">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                                                        ? 'bg-red-100 text-red-700'
                                                        : user.role === 'TEACHER'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-green-100 text-green-700'
                                                    }`}
                                            >
                                                {user.role === 'ADMIN' && 'Administrador'}
                                                {user.role === 'TEACHER' && 'Profesor'}
                                                {user.role === 'STUDENT' && 'Estudiante'}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString('es-ES')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
