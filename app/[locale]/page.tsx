import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function HomePage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Redirect based on role
    if (session.user.role === 'ADMIN') {
        redirect('/admin');
    } else if (session.user.role === 'TEACHER') {
        redirect('/teacher');
    } else {
        redirect('/student');
    }
}
