import { auth } from '@/auth';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { canUploadDocuments } from '@/lib/auth/roles';
import { processDocument } from '@/lib/rag/document-processor';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024);

export async function POST(request: Request) {
    return Response.json({ error: 'Document upload is disabled' }, { status: 404 });
}
