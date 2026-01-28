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

export function Navbar({ user }: NavbarProps) {
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
            <div className="container flex h-14 items-center">
                {/* Logo */}
                <div className="mr-8 flex items-center space-x-2">
                    <Image
                        src="/logo-ies-rincon.png"
                        alt="IES El Rincón"
                        width={32}
                        height={32}
                        className="rounded"
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
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* User Menu */}
                <div className="flex items-center space-x-4">
                    <span className="hidden md:inline text-sm text-muted-foreground">
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
                                        {ROLE_LABELS[user.role]}
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                                // Use window.location to trigger server-side signout with CSRF
                                window.location.href = '/api/auth/signout';
                            }}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar Sesión
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
