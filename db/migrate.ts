import { sql } from 'drizzle-orm';
import { db, client } from './index';

async function runMigration() {
    console.log('Running migrations...');

    try {
        // Enable pgvector extension
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
        console.log('✅ pgvector extension enabled');

        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
