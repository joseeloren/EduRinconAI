import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { assistantAccess, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role === 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json(
                { error: 'Student ID is required' },
                { status: 400 }
            );
        }

        // Verify student exists and has STUDENT role
        const student = await db.query.users.findFirst({
            where: eq(users.id, studentId),
        });

        if (!student || student.role !== 'STUDENT') {
            return NextResponse.json(
                { error: 'Invalid student ID' },
                { status: 400 }
            );
        }

        // Check if already assigned
        const existing = await db.query.assistantAccess.findFirst({
            where: and(
                eq(assistantAccess.assistantId, params.id),
                eq(assistantAccess.userId, studentId)
            ),
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Student already assigned to this assistant' },
                { status: 400 }
            );
        }

        // Create assignment
        const [assignment] = await db
            .insert(assistantAccess)
            .values({
                assistantId: params.id,
                userId: studentId,
                grantedById: session.user.id,
            })
            .returning();

        return NextResponse.json(assignment);
    } catch (error) {
        console.error('Error assigning student:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role === 'STUDENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json(
                { error: 'Student ID is required' },
                { status: 400 }
            );
        }

        // Delete assignment
        await db
            .delete(assistantAccess)
            .where(
                and(
                    eq(assistantAccess.assistantId, params.id),
                    eq(assistantAccess.userId, studentId)
                )
            );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing student assignment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Get all students assigned to this assistant
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const assignments = await db.query.assistantAccess.findMany({
            where: eq(assistantAccess.assistantId, params.id),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
