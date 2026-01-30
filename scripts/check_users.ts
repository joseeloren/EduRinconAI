import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('📂 CWD:', process.cwd());
console.log('🔑 DATABASE_URL:', process.env.DATABASE_URL ? 'Defined (starts with ' + process.env.DATABASE_URL.substring(0, 10) + '...)' : 'UNDEFINED');

import { db } from '../db';
import { users } from '../db/schema';

async function main() {
    console.log('🔍 Checking database users...');
    const allUsers = await db.select().from(users);

    if (allUsers.length === 0) {
        console.log('❌ No users found in the database!');
    } else {
        console.log(`✅ Found ${allUsers.length} users:`);
        allUsers.forEach(u => {
            console.log(` - ${u.email} (Role: ${u.role})`);
        });
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
