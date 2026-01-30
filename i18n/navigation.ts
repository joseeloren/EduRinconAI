import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const locales = ['es', 'en'] as const;
export const localePrefix = 'always'; // Default

export const routing = defineRouting({
    locales,
    defaultLocale: 'es',
    localePrefix
});

export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
