import { redirect } from '@/i18n/navigation';
import { auth } from '@/auth';

export default async function HomePage() {
    const session = await auth();

    if (!session?.user) {
        redirect({ href: '/login' });
    }

    // Redirect based on role
    if (session.user.role === 'ADMIN') {
        redirect({ href: '/admin' });
    } else if (session.user.role === 'TEACHER') {
        redirect({ href: '/teacher' });
    } else {
        redirect({ href: '/student' });
    }
}
