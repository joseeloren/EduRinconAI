import { auth } from '@/auth';
import { redirect } from '@/i18n/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Navbar } from '@/components/ui/navbar';
import { UserForm } from '@/components/admin/user-form';

interface PageProps {
    params: Promise<{
        id: string;
        locale: string;
    }>;
}

export default async function EditUserPage({ params }: PageProps) {
    const { id, locale } = await params;
    const session = await auth();

    if (!session || !session.user || session.user.role !== 'ADMIN') {
        redirect({ href: '/login', locale });
        return;
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    if (!user) {
        redirect({ href: '/admin/users', locale });
        return;
    }

    return (
        <>
            <Navbar user={session.user} />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="container mx-auto px-4 py-8 max-w-2xl">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        Editar Usuario
                    </h1>
                    <UserForm initialData={user} isEditing />
                </div>
            </div>
        </>
    );
}
