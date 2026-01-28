'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Search } from 'lucide-react';

interface Student {
    id: string;
    name: string;
    email: string;
}

interface Assignment {
    id: string;
    user: Student;
    grantedAt: string;
}

interface StudentAssignmentProps {
    assistantId: string;
}

export function StudentAssignment({ assistantId }: StudentAssignmentProps) {
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [assistantId]);

    async function loadData() {
        try {
            setLoading(true);

            // Fetch all students
            const studentsRes = await fetch('/api/users?role=STUDENT');
            const studentsData = await studentsRes.json();
            setAllStudents(studentsData);

            // Fetch current assignments
            const assignmentsRes = await fetch(`/api/assistants/${assistantId}/assign`);
            const assignmentsData = await assignmentsRes.json();
            setAssignments(assignmentsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAssign(studentId: string) {
        try {
            setActionLoading(studentId);
            const res = await fetch(`/api/assistants/${assistantId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId }),
            });

            if (!res.ok) throw new Error('Failed to assign student');

            await loadData();
        } catch (error) {
            console.error('Error assigning student:', error);
            alert('Error al asignar estudiante');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleUnassign(studentId: string) {
        try {
            setActionLoading(studentId);
            const res = await fetch(
                `/api/assistants/${assistantId}/assign?studentId=${studentId}`,
                { method: 'DELETE' }
            );

            if (!res.ok) throw new Error('Failed to unassign student');

            await loadData();
        } catch (error) {
            console.error('Error unassigning student:', error);
            alert('Error al desasignar estudiante');
        } finally {
            setActionLoading(null);
        }
    }

    const assignedStudentIds = new Set(assignments.map((a) => a.user.id));
    const availableStudents = allStudents.filter(
        (s) => !assignedStudentIds.has(s.id)
    );

    const filteredAvailable = availableStudents.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="text-center py-8">Cargando...</div>;
    }

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Available Students */}
            <Card>
                <CardHeader>
                    <CardTitle>Estudiantes Disponibles</CardTitle>
                    <CardDescription>
                        Selecciona estudiantes para asignarlos a este asistente
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar estudiante..."
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <ScrollArea className="h-[400px]">
                            <div className="space-y-2">
                                {filteredAvailable.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No hay estudiantes disponibles
                                    </p>
                                ) : (
                                    filteredAvailable.map((student) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{student.name}</p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {student.email}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAssign(student.id)}
                                                disabled={actionLoading === student.id}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>

            {/* Assigned Students */}
            <Card>
                <CardHeader>
                    <CardTitle>Estudiantes Asignados</CardTitle>
                    <CardDescription>
                        <Badge variant="secondary">{assignments.length}</Badge> estudiante
                        {assignments.length !== 1 ? 's' : ''} con acceso
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[460px]">
                        <div className="space-y-2">
                            {assignments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Ningún estudiante asignado aún
                                </p>
                            ) : (
                                assignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {assignment.user.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {assignment.user.email}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleUnassign(assignment.user.id)}
                                            disabled={actionLoading === assignment.user.id}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
