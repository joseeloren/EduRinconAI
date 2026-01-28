import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/ui/navbar';
import { UserForm } from '@/components/admin/user-form';

export default async function CreateUserPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/login');
    }

    return (
        <>
            <Navbar user={session.user} />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="container mx-auto px-4 py-8 max-w-2xl">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        Crear Nuevo Usuario
                    </h1>
                    <UserForm />
                </div>
            </div>
        </>
    );
}
