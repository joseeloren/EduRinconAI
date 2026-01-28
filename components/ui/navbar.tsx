'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface NavbarProps {
    user: {
        name: string;
        email: string;
        role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    };
}

const ROLE_LABELS = {
    ADMIN: 'Administrador',
    TEACHER: 'Profesor',
    STUDENT: 'Estudiante',
};

const NAV_LINKS = {
    ADMIN: [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/users', label: 'Usuarios' },
    ],
    TEACHER: [
        { href: '/teacher', label: 'Dashboard' },
        { href: '/teacher/assistants/create', label: 'Crear Asistente' },
    ],
    STUDENT: [
        { href: '/student', label: 'Mis Asistentes' },
        { href: '/student/chats', label: 'Historial' },
    ],
};

import { useTranslations } from 'next-intl';

// ... (imports)

// ... (ROLE_LABELS removed or unused if we translate them)

export function Navbar({ user }: NavbarProps) {
    const t = useTranslations('Navbar');
    const pathname = usePathname();
    const links = NAV_LINKS[user.role];
    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center px-4">
                {/* Logo */}
                <div className="mr-8 flex items-center space-x-2">
                    {/* ... (Image) */}
                    <Image
                        src="/logo-ies-rincon.jpg"
                        alt="IES El Rincón"
                        width={32}
                        height={32}
                        className="rounded"
                        unoptimized
                    />
                    <span className="hidden font-bold sm:inline-block">
                        EduRincón AI
                    </span>
                </div>

                {/* Navigation Links */}
                <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`transition-colors hover:text-foreground/80 ${pathname === link.href
                                ? 'text-foreground'
                                : 'text-foreground/60'
                                }`}
                        >
                            {/* We might need to translate link labels too, but for now specific links are hardcoded in NAV_LINKS */}
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* User Menu */}
                <div className="flex items-center space-x-4">
                    <LanguageSwitcher />
                    <span className="hidden md:inline text-sm text-muted-foreground">
                        {/* Example translation: "Dashboard: Prof" or similar if we added keys */}
                        Hola, <span className="font-medium text-foreground">{user.name}</span>
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.role}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    Perfil
                                </Link>
                            </DropdownMenuItem>
                            {/* ... */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                                window.location.href = '/api/auth/signout';
                            }}>
                                <LogOut className="mr-2 h-4 w-4" />
                                {t('login')} {/* Reusing login key for Logout/Login context or adding new key? Actually t('login') is 'Iniciar Sesion', we need 'Logout' */}
                                Cerrar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
