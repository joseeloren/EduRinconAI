import { auth } from '@/auth';
import { db } from '@/db';
import { assistants, assistantAccess } from '@/db/schema';
import { canCreateAssistant } from '@/lib/auth/roles';
import { eq, or, and } from 'drizzle-orm';

// GET: List assistants accessible to the user
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let userAssistants;

        if (session.user.role === 'ADMIN') {
            // Admins see all assistants
            userAssistants = await db.select().from(assistants);
        } else if (session.user.role === 'TEACHER') {
            // Teachers see their own assistants
            userAssistants = await db
                .select()
                .from(assistants)
                .where(eq(assistants.createdById, session.user.id));
        } else {
            // Students see public assistants and those explicitly granted
            const accessibleAssistants = await db
                .select({
                    assistant: assistants,
                })
                .from(assistants)
                .leftJoin(
                    assistantAccess,
                    and(
                        eq(assistantAccess.assistantId, assistants.id),
                        eq(assistantAccess.userId, session.user.id)
                    )
                )
                .where(
                    or(
                        eq(assistants.isPublic, 1),
                        eq(assistantAccess.userId, session.user.id)
                    )
                );

            userAssistants = accessibleAssistants.map((row) => row.assistant);
        }

        return Response.json({ assistants: userAssistants });
    } catch (error) {
        console.error('List assistants error:', error);
        return Response.json({ error: 'Failed to fetch assistants' }, { status: 500 });
    }
}

// POST: Create a new assistant
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!canCreateAssistant(session.user.role)) {
            return Response.json(
                { error: 'Forbidden: Only teachers can create assistants' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, systemPrompt, isPublic, temperature } = body;

        if (!name || !systemPrompt) {
            return Response.json(
                { error: 'Name and system prompt are required' },
                { status: 400 }
            );
        }

        const [assistant] = await db
            .insert(assistants)
            .values({
                name,
                description,
                systemPrompt,
                createdById: session.user.id,
                isPublic: isPublic ? 1 : 0,
                temperature: temperature || 70,
            })
            .returning();

        return Response.json({ assistant });
    } catch (error) {
        console.error('Create assistant error:', error);
        return Response.json({ error: 'Failed to create assistant' }, { status: 500 });
    }
}
