'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
    id: string;
    name: string;
    type: string;
    size: number;
    status: string;
    createdAt: string;
}

interface KnowledgeManagerProps {
    assistantId: string;
}

export function KnowledgeManager({ assistantId }: KnowledgeManagerProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number; percentage: number } | null>(null);

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/assistants/${assistantId}/documents`);
            if (!res.ok) throw new Error('Failed to fetch documents');
            const data = await res.json();
            setDocuments(data.documents);
        } catch (error) {
            console.error('Error fetching documents:', error);
            toast.error('Error al cargar documentos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [assistantId]);

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        const file = acceptedFiles[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`/api/assistants/${assistantId}/documents`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to upload document');
            }

            // Handle stream
            const reader = res.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const decoder = new TextDecoder();
            let finished = false;

            while (!finished) {
                const { value, done } = await reader.read();
                if (done) {
                    finished = true;
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.type === 'progress') {
                            setProgress({
                                current: data.current,
                                total: data.total,
                                percentage: data.percentage
                            });
                        } else if (data.type === 'error') {
                            throw new Error(data.message);
                        } else if (data.type === 'complete') {
                            if (data.success) {
                                toast.success(`Documento "${file.name}" procesado correctamente (${data.chunksCreated} fragmentos)`);
                            } else {
                                toast.error('El documento se subió pero no se pudieron generar fragmentos');
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing stream line:', e);
                    }
                }
            }

            fetchDocuments();
        } catch (error: any) {
            toast.error(error.message || 'Error al subir el documento');
        } finally {
            setUploading(false);
            setProgress(null);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
        },
        multiple: false,
        disabled: uploading,
    });

    const handleDelete = async (docId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este documento? Se borrarán todos sus vectores asociados.')) return;

        try {
            // We need a DELETE route. I'll implement it next.
            const res = await fetch(`/api/assistants/${assistantId}/documents/${docId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete document');

            toast.success('Documento eliminado');
            setDocuments(docs => docs.filter(d => d.id !== docId));
        } catch (error) {
            toast.error('Error al eliminar el documento');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Subir Documentos
                    </CardTitle>
                    <CardDescription>
                        Añade archivos PDF, Word o Texto para mejorar el conocimiento de este asistente. Por ahora se procesan un máximo de 800 caracteres por fragmento.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center">
                            {uploading ? (
                                <>
                                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                                    <p className="text-sm font-medium">
                                        {progress
                                            ? `Procesando: ${progress.current} de ${progress.total}`
                                            : 'Subiendo y analizando...'}
                                    </p>

                                    {progress && (
                                        <div className="w-full max-w-xs mt-4">
                                            <div className="bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                <div
                                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${progress.percentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                                Generando vectores de conocimiento ({progress.percentage}%)
                                            </p>
                                        </div>
                                    )}

                                    {!progress && (
                                        <p className="text-xs text-muted-foreground mt-1 text-center">
                                            Extrayendo texto del archivo...
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 text-gray-400 mb-4" />
                                    <p className="text-sm font-medium">
                                        {isDragActive ? 'Suelta el archivo aquí' : 'Haz clic o arrastra un archivo aquí'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX o TXT (MAX. 10MB)</p>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Base de Conocimiento
                    </CardTitle>
                    <CardDescription>
                        Lista de documentos que este asistente utiliza para responder.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {documents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground italic">
                            No hay documentos todavía. Sube uno arriba para empezar.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {documents.map((doc) => (
                                <div key={doc.id} className="py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded">
                                            <FileText className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{doc.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {doc.type}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {(doc.size! / 1024).toFixed(1)} KB
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px]">
                                                    {doc.status === 'ready' ? (
                                                        <span className="text-green-600 flex items-center gap-0.5">
                                                            <CheckCircle2 className="h-3 w-3" /> Listo
                                                        </span>
                                                    ) : doc.status === 'processing' ? (
                                                        <span className="text-blue-600 flex items-center gap-0.5">
                                                            <Loader2 className="h-3 w-3 animate-spin" /> Procesando
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 flex items-center gap-0.5">
                                                            <AlertCircle className="h-3 w-3" /> Error
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(doc.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
