'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DeleteAssistantButtonProps {
    assistantId: string;
    assistantName: string;
    onDelete: () => Promise<void>;
}

export function DeleteAssistantButton({
    assistantId,
    assistantName,
    onDelete,
}: DeleteAssistantButtonProps) {
    const t = useTranslations('assistantManagement');
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        try {
            setLoading(true);
            await onDelete();
        } catch (error) {
            // Next.js redirect() throws a special error that should not be caught
            // Check if it's a Next.js redirect error (NEXT_REDIRECT)
            if (error && typeof error === 'object' && 'digest' in error &&
                typeof (error as any).digest === 'string' &&
                (error as any).digest.includes('NEXT_REDIRECT')) {
                // This is a redirect, not a real error - rethrow it
                throw error;
            }

            console.error('Error deleting assistant:', error);
            alert(t('deleteError'));
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('deleteButton')}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('deleteDescription')} <strong>{assistantName}</strong> {t('deleteDescriptionExtra')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading ? t('deleting') : t('delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
