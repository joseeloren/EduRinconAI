import { verifyCaptcha } from '@/lib/captcha';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    providers: [
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Verify captcha if in production or token provided
                // Verify captcha if in production or token provided
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const creds = credentials as any;
                console.log('🔐 Auth Attempt for:', credentials.email);
                console.log('🎟️ Captcha Token:', creds.captchaToken);
                console.log('🔧 Debug Mode:', process.env.NEXT_PUBLIC_DEBUG_MODE);

                if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
                    console.log('⚠️ Debug/Bypass Captcha');
                } else if (creds.captchaToken) {
                    const isCaptchaValid = await verifyCaptcha(creds.captchaToken as string);
                    if (!isCaptchaValid) {
                        console.log('🚫 Captcha Invalid');
                        throw new Error('Captcha inválido');
                    }
                } else if (process.env.NODE_ENV === 'production') {
                    // console.log('🚫 Captcha Required');
                    // throw new Error('Captcha requerido');
                }

                const user = await db.query.users.findFirst({
                    where: eq(users.email, credentials.email as string),
                });

                console.log('👤 User Found:', user ? 'YES' : 'NO');

                if (!user) {
                    console.log('❌ User not found in DB');
                    return null;
                }

                console.log('🔑 Hashed Password in DB:', user.passwordHash.substring(0, 10) + '...');

                const isValidPassword = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );

                console.log('✅ Password Valid:', isValidPassword);

                if (!isValidPassword) {
                    console.log('❌ Password mismatch');
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as 'ADMIN' | 'TEACHER' | 'STUDENT';
            }
            return session;
        },
    },
});
