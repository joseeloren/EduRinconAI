'use client';

import ReCAPTCHA from 'react-google-recaptcha';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface CaptchaProps {
    onChange: (token: string | null) => void;
}

export function Captcha({ onChange }: CaptchaProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !siteKey) {
        if (!siteKey && mounted) {
            console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined');
        }
        return null;
    }

    return (
        <div className="flex justify-center my-4">
            <ReCAPTCHA
                sitekey={siteKey}
                onChange={onChange}
                theme={theme === 'dark' ? 'dark' : 'light'}
            />
        </div>
    );
}
