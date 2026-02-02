
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('🔄 Resetting passwords...');
    const newHash = await bcrypt.hash('C1av3-2026', 10);

    await db.update(users)
        .set({ passwordHash: newHash })
        .where(eq(users.email, 'student@ieselrincon.es'));

    await db.update(users)
        .set({ passwordHash: newHash })
        .where(eq(users.email, 'teacher@ieselrincon.es'));

    await db.update(users)
        .set({ passwordHash: newHash })
        .where(eq(users.email, 'admin@ieselrincon.es'));

    console.log('✅ Passwords reset to "password" for student, teacher, and admin.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
