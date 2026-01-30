'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface UserFormProps {
    initialData?: {
        id: string;
        name: string;
        email: string;
        role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    };
    isEditing?: boolean;
    onSuccess?: () => void;
}

export function UserForm({ initialData, isEditing = false, onSuccess }: UserFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        password: '',
        role: initialData?.role || 'STUDENT',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = '/api/users';
            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing
                ? { id: initialData?.id, ...formData }
                : formData;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al guardar usuario');
            }

            toast.success(
                isEditing ? 'Usuario actualizado' : 'Usuario creado',
                isEditing ? 'Los cambios se han guardado correctamente' : 'El usuario se ha creado correctamente'
            );

            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/admin');
                router.refresh();
            }
        } catch (error: any) {
            toast.error('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</CardTitle>
                    <CardDescription>
                        {isEditing
                            ? 'Modifica los detalles del usuario'
                            : 'Completa los datos para crear un nuevo usuario'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Nombre */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Juan Pérez"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="juan@iesrincon.es"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">
                            Contraseña {isEditing && '(dejar en blanco para no cambiar)'}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            required={!isEditing}
                        />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Rol *</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(value) => setFormData({ ...formData, role: value as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STUDENT">Estudiante</SelectItem>
                                <SelectItem value="TEACHER">Profesor</SelectItem>
                                <SelectItem value="ADMIN">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
