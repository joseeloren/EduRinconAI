'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Document {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    processingError: string | null;
    createdAt: string;
}

interface DocumentListProps {
    assistantId: string;
}

const STATUS_CONFIG = {
    PENDING: {
        label: 'Pendiente',
        icon: Clock,
        variant: 'secondary' as const,
    },
    PROCESSING: {
        label: 'Procesando',
        icon: Loader2,
        variant: 'default' as const,
    },
    COMPLETED: {
        label: 'Completado',
        icon: CheckCircle2,
        variant: 'success' as const,
    },
    FAILED: {
        label: 'Error',
        icon: XCircle,
        variant: 'destructive' as const,
    },
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function DocumentList({ assistantId }: DocumentListProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    useEffect(() => {
        loadDocuments();
        // Refresh every 5 seconds if there are processing documents
        const interval = setInterval(() => {
            if (documents.some((d) => d.status === 'PROCESSING')) {
                loadDocuments();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [assistantId, documents.some((d) => d.status === 'PROCESSING')]);

    async function loadDocuments() {
        try {
            const res = await fetch(`/api/documents?assistantId=${assistantId}`);
            if (!res.ok) throw new Error('Failed to fetch documents');
            const data = await res.json();
            setDocuments(data);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(docId: string) {
        if (!confirm('¿Estás seguro de eliminar este documento?')) return;

        try {
            setDeleteLoading(docId);
            const res = await fetch(`/api/documents/${docId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete document');

            await loadDocuments();
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Error al eliminar documento');
        } finally {
            setDeleteLoading(null);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <ScrollArea className="h-[500px]">
            <div className="space-y-3">
                {documents.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay documentos subidos aún</p>
                            <p className="text-sm mt-2">
                                Sube documentos para que el asistente pueda responder con contexto
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    documents.map((doc) => {
                        const StatusIcon = STATUS_CONFIG[doc.status].icon;
                        return (
                            <Card key={doc.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-base truncate">
                                                    {doc.originalName}
                                                </CardTitle>
                                                <CardDescription className="mt-1.5 flex items-center gap-2 flex-wrap">
                                                    <span>{formatFileSize(doc.size)}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {formatDistanceToNow(new Date(doc.createdAt), {
                                                            addSuffix: true,
                                                            locale: es,
                                                        })}
                                                    </span>
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={STATUS_CONFIG[doc.status].variant}>
                                            <StatusIcon
                                                className={`h-3 w-3 mr-1 ${doc.status === 'PROCESSING' ? 'animate-spin' : ''
                                                    }`}
                                            />
                                            {STATUS_CONFIG[doc.status].label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                {(doc.status === 'FAILED' || doc.status === 'COMPLETED') && (
                                    <CardContent>
                                        {doc.status === 'FAILED' && doc.processingError && (
                                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-3">
                                                <p className="font-medium">Error de procesamiento:</p>
                                                <p className="mt-1">{doc.processingError}</p>
                                            </div>
                                        )}
                                        <div className="flex justify-end">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(doc.id)}
                                                disabled={deleteLoading === doc.id}
                                            >
                                                {deleteLoading === doc.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    'Eliminar'
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </ScrollArea>
    );
}
