import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default async function UsersManagementPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/login');
    }

    const allUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)],
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
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">
                                Gestión de Usuarios
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Administra los usuarios del sistema
                            </p>
                        </div>
                        <Link href="/admin/users/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Crear Usuario
                            </Button>
                        </Link>
                    </div>

                    {/* Users Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Usuarios ({allUsers.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {allUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant={
                                                    user.role === 'ADMIN'
                                                        ? 'destructive'
                                                        : user.role === 'TEACHER'
                                                            ? 'default'
                                                            : 'secondary'
                                                }
                                            >
                                                {user.role === 'ADMIN' && 'Administrador'}
                                                {user.role === 'TEACHER' && 'Profesor'}
                                                {user.role === 'STUDENT' && 'Estudiante'}
                                            </Badge>
                                            <Link href={`/admin/users/${user.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            {user.id !== session.user.id && (
                                                <form action={`/api/users?id=${user.id}`} method="DELETE">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
