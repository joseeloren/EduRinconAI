'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ className }: { className?: string }) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLanguage = () => {
        const nextLocale = locale === 'es' ? 'en' : 'es';
        router.replace(pathname, { locale: nextLocale });
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className={`flex items-center gap-2 ${className}`}
        >
            <Globe className="w-4 h-4" />
            <span className="uppercase">{locale}</span>
        </Button>
    );
}
