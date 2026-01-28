import { db, client } from '../db/index.js';
import { users } from '../db/schema.js';
import bcrypt from 'bcryptjs';

async function seedUsers() {
    console.log('🌱 Seeding users...');

    try {
        const hashedPassword = await bcrypt.hash('password', 10);

        const newUsers = await db
            .insert(users)
            .values([
                {
                    email: 'admin@iesrincon.es',
                    name: 'Administrador',
                    role: 'ADMIN',
                    passwordHash: hashedPassword,
                },
                {
                    email: 'teacher@iesrincon.es',
                    name: 'Profesor Demo',
                    role: 'TEACHER',
                    passwordHash: hashedPassword,
                },
                {
                    email: 'student@iesrincon.es',
                    name: 'Alumno Demo',
                    role: 'STUDENT',
                    passwordHash: hashedPassword,
                },
            ])
            .returning();

        console.log('✅ Users created successfully:');
        newUsers.forEach((user) => {
            console.log(`   - ${user.email} (${user.role})`);
        });

        console.log('\n📧 Login credentials (all users):');
        console.log('   Password: password');
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seedUsers();
