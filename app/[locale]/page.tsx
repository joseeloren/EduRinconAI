import { redirect } from '@/i18n/navigation';
import { auth } from '@/auth';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    const session = await auth();
    const { locale } = await params;

    if (!session?.user) {
        redirect({ href: '/login', locale });
        return;
    }

    // Redirect based on role
    if (session.user.role === 'ADMIN') {
        redirect({ href: '/admin', locale });
    } else if (session.user.role === 'TEACHER') {
        redirect({ href: '/teacher', locale });
    } else {
        redirect({ href: '/student', locale });
    }
}
