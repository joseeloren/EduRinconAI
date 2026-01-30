export async function verifyCaptcha(token: string): Promise<boolean> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        console.warn('RECAPTCHA_SECRET_KEY is not defined');
        // If no key is configured, validation fails for security defaults 
        // OR returns true for development if preferred, but secure default is safer.
        // Assuming we want to block if not configured properly in prod.
        // For dev without keys, perhaps we want to allow? 
        // Let's allow IF we are not in production strictly? 
        // No, better to force configuration or fail.
        return false;
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${secretKey}&response=${token}`,
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error verifying captcha:', error);
        return false;
    }
}
