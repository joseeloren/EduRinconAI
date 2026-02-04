
import { db } from './db';
import { sql } from 'drizzle-orm';

async function test() {
    try {
        const result = await db.execute(sql`SELECT 1`);
        console.log('Database connection successful:', result);
        process.exit(0);
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

test();
