'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useTranslations } from 'next-intl';

interface AssistantFormProps {
    initialData?: {
        id?: string;
        name: string;
        description: string;
        systemPrompt: string;
        temperature: number;
        isPublic: boolean;
    };
    onSubmit: (data: AssistantFormData) => Promise<void>;
    isEditing?: boolean;
}

export interface AssistantFormData {
    name: string;
    description: string;
    systemPrompt: string;
    temperature: number;
    isPublic: boolean;
}

export function AssistantForm({ initialData, onSubmit, isEditing = false }: AssistantFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<AssistantFormData>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        systemPrompt: initialData?.systemPrompt || '',
        temperature: initialData?.temperature || 0.7,
        isPublic: initialData?.isPublic || false,
    });

    const t = useTranslations('assistantForm');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit(formData);
        } catch (error) {
            // Next.js redirect() throws a special error that should not be caught
            // Check if it's a Next.js redirect error (NEXT_REDIRECT)
            if (error && typeof error === 'object' && 'digest' in error &&
                typeof (error as any).digest === 'string' &&
                (error as any).digest.includes('NEXT_REDIRECT')) {
                // This is a redirect, not a real error - rethrow it
                throw error;
            }

            console.error('Error submitting form:', error);
            alert(t('errorSaving') || 'Error al guardar el asistente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? t('editTitle') : t('createTitle')}</CardTitle>
                    <CardDescription>
                        {isEditing
                            ? t('editDescription')
                            : t('createDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Nombre */}
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('nameLabel')}</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('namePlaceholder')}
                            required
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="description">{t('descriptionLabel')}</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t('descriptionPlaceholder')}
                            rows={3}
                        />
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                        <Label htmlFor="systemPrompt">{t('systemPromptLabel')}</Label>
                        <Textarea
                            id="systemPrompt"
                            value={formData.systemPrompt}
                            onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                            placeholder={t('systemPromptPlaceholder')}
                            rows={8}
                            required
                        />
                        <p className="text-sm text-muted-foreground">
                            {t('systemPromptHelp')}
                        </p>
                    </div>

                    {/* Temperatura */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="temperature">{t('temperatureLabel')}</Label>
                            <span className="text-sm font-medium">{formData.temperature.toFixed(1)}</span>
                        </div>
                        <Slider
                            id="temperature"
                            min={0}
                            max={1}
                            step={0.1}
                            value={[formData.temperature]}
                            onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
                        />
                        <p className="text-sm text-muted-foreground">
                            {t('temperatureHelp')}
                        </p>
                    </div>

                    {/* Público */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isPublic"
                            checked={formData.isPublic}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, isPublic: checked as boolean })
                            }
                        />
                        <div className="space-y-1">
                            <Label htmlFor="isPublic" className="cursor-pointer">
                                {t('isPublicLabel')}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {t('isPublicHelp')}
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? t('saving') : isEditing ? t('saveChanges') : t('createAssistant')}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
