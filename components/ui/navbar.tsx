'use client';

import { Link, usePathname } from '@/i18n/navigation';
import Image from 'next/image';
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
import { useTranslations } from 'next-intl';

interface NavbarProps {
    user?: {
        name: string;
        email: string;
        role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    } | null;
}

export function Navbar({ user }: NavbarProps) {
    const t = useTranslations();
    const pathname = usePathname();

    const NAV_LINKS = {
        ADMIN: [
            { href: '/admin', label: t('navbar.dashboard') },
            { href: '/admin/users', label: t('navbar.users') },
        ],
        TEACHER: [
            { href: '/teacher', label: t('navbar.dashboard') },
            { href: '/teacher/assistants/create', label: t('navbar.createAssistant') },
        ],
        STUDENT: [
            { href: '/student', label: t('navbar.myAssistants') },
            { href: '/student/chats', label: t('navbar.history') },
        ],
    };

    const links = user ? NAV_LINKS[user.role] : [];
    const initials = user?.name
        ? user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : '';

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center px-4">
                {/* Logo */}
                <div className="mr-8 flex items-center space-x-2">
                    <Image
                        src="/logo-mentorai.png"
                        alt="MentorAI"
                        width={32}
                        height={32}
                        className="rounded"
                        unoptimized
                    />
                    <span className="hidden font-bold sm:inline-block">
                        MentorAI
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
                    <LanguageSwitcher />
                    {user && (
                        <>
                            <span className="hidden md:inline text-sm text-muted-foreground">
                                {t('navbar.greeting')}, <span className="font-medium text-foreground">{user.name}</span>
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
                                                {t(`roles.${user.role.toLowerCase()}`)}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => {
                                        window.location.href = '/api/auth/signout';
                                    }}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        {t('navbar.logout')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
