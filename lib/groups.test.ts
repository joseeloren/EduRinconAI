import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGroup, addStudentToGroup, addTeacherToGroup, assignAssistantToGroup } from './groups';
import { db } from '@/db';

// Mock the db
vi.mock('@/db', () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
            })),
        })),
    },
}));

describe('Groups Management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a new group', async () => {
        const groupData = {
            name: 'Grupo A',
            description: 'Matemáticas de primero',
        };

        const result = await createGroup(groupData);

        expect(db.insert).toHaveBeenCalled();
        expect(result).toHaveProperty('id', 'mock-id');
    });

    it('should add a student to a group', async () => {
        const groupId = 'group-1';
        const studentId = 'student-1';

        await addStudentToGroup(groupId, studentId);

        expect(db.insert).toHaveBeenCalled();
    });

    it('should add a teacher to a group', async () => {
        const groupId = 'group-1';
        const teacherId = 'teacher-1';

        await addTeacherToGroup(groupId, teacherId);

        expect(db.insert).toHaveBeenCalled();
    });

    it('should assign an assistant to a group', async () => {
        const groupId = 'group-1';
        const assistantId = 'assistant-1';
        const assignedBy = 'admin-1';

        await assignAssistantToGroup(groupId, assistantId, assignedBy);

        expect(db.insert).toHaveBeenCalled();
    });
});
