import { db } from '@/db';
import { studentGroups, studentGroupMembers, teacherGroupAccess, assistantGroupAccess } from '@/db/schema';

export async function createGroup(data: { name: string; description?: string }) {
    const [newGroup] = await db.insert(studentGroups).values({
        name: data.name,
        description: data.description || null,
    }).returning();
    
    return newGroup;
}

export async function addStudentToGroup(groupId: string, studentId: string) {
    await db.insert(studentGroupMembers).values({
        groupId,
        userId: studentId,
    });
}

export async function addTeacherToGroup(groupId: string, teacherId: string) {
    await db.insert(teacherGroupAccess).values({
        groupId,
        teacherId,
    });
}

export async function assignAssistantToGroup(groupId: string, assistantId: string, grantedById: string) {
    await db.insert(assistantGroupAccess).values({
        groupId,
        assistantId,
        grantedById,
    });
}
