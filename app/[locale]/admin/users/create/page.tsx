import { auth } from '@/auth';
import { redirect } from '@/i18n/navigation';
import { Navbar } from '@/components/ui/navbar';
import { UserForm } from '@/components/admin/user-form';

export default async function CreateUserPage({ params }: { params: Promise<{ locale: string }> }) {
    const session = await auth();
    const { locale } = await params;

    if (!session || !session.user || session.user.role !== 'ADMIN') {
        redirect({ href: '/login', locale });
        return;
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
