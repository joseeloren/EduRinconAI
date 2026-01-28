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
    try {
        const session = await auth();
        if (!session?.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permissions
        if (!canUploadDocuments(session.user.role)) {
            return Response.json(
                { error: 'Forbidden: Only teachers can upload documents' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const assistantId = formData.get('assistantId') as string;

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!assistantId) {
            return Response.json({ error: 'Assistant ID required' }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return Response.json(
                { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ];

        if (!allowedTypes.includes(file.type)) {
            return Response.json(
                { error: 'Unsupported file type. Only PDF, DOCX, and TXT are allowed.' },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        await mkdir(UPLOAD_DIR, { recursive: true });

        // Generate unique filename
        const fileExtension = path.extname(file.name);
        const uniqueFilename = `${randomUUID()}${fileExtension}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFilename);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Create document record
        const [document] = await db
            .insert(documents)
            .values({
                filename: filePath,
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                uploadedById: session.user.id,
                assistantId: assistantId,
                status: 'PENDING',
            })
            .returning();

        // Process document asynchronously (don't await)
        processDocument(document.id).catch((error) => {
            console.error(`Failed to process document ${document.id}:`, error);
        });

        return Response.json({
            success: true,
            document: {
                id: document.id,
                name: document.originalName,
                status: document.status,
            },
        });
    } catch (error) {
        console.error('Document upload error:', error);
        return Response.json({ error: 'Failed to upload document' }, { status: 500 });
    }
}
