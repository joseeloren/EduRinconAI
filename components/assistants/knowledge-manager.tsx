'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { useTranslations } from 'next-intl';

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
    const t = useTranslations('knowledgeManager');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeDocId, setActiveDocId] = useState<string | null>(null);
    const [progressMap, setProgressMap] = useState<Record<string, { current: number; total: number; percentage: number }>>({});

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/assistants/${assistantId}/documents`);
            if (!res.ok) throw new Error('Failed to fetch documents');
            const data = await res.json();
            setDocuments(data.documents);
        } catch (error) {
            console.error('Error fetching documents:', error);
            toast.error(t('fetchError'));
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
            let partialLine = '';

            while (!finished) {
                const { value, done } = await reader.read();
                if (done) {
                    finished = true;
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                console.log(`[Stream] Raw chunk:`, chunk);
                const content = partialLine + chunk;
                const lines = content.split('\n');

                // The last element might be a partial line
                partialLine = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        console.log(`[Stream] Parsed data:`, data);
                        if (data.type === 'start') {
                            setActiveDocId(data.docId);
                            setProgressMap(prev => ({
                                ...prev,
                                [data.docId]: { current: 0, total: data.totalChunks, percentage: 0 }
                            }));
                            // Fetch slightly later to ensure DB consistency
                            setTimeout(fetchDocuments, 500);
                        } else if (data.type === 'progress') {
                            const targetId = data.docId || activeDocId;
                            if (targetId) {
                                setProgressMap(prev => ({
                                    ...prev,
                                    [targetId]: {
                                        current: data.current,
                                        total: data.total,
                                        percentage: data.percentage
                                    }
                                }));
                            }
                        } else if (data.type === 'error') {
                            throw new Error(data.message);
                        } else if (data.type === 'complete') {
                            if (data.success) {
                                toast.success(t('uploadSuccess', { name: file.name }));
                            } else {
                                toast.error(t('uploadError'));
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing stream line:', e, line);
                    }
                }
            }

            fetchDocuments();
        } catch (error: any) {
            toast.error(error.message || t('uploadError'));
        } finally {
            setUploading(false);
            setActiveDocId(null);
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
        if (!confirm(t('deleteConfirm'))) return;

        try {
            const res = await fetch(`/api/assistants/${assistantId}/documents/${docId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete document');

            toast.success(t('deleteSuccess'));
            setDocuments(docs => docs.filter(d => d.id !== docId));
        } catch (error) {
            toast.error(t('deleteError'));
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
                        {t('uploadTitle')}
                    </CardTitle>
                    <CardDescription>
                        {t('uploadDescription')}
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
                                        {activeDocId && progressMap[activeDocId]
                                            ? t('processing', {
                                                current: progressMap[activeDocId].current,
                                                total: progressMap[activeDocId].total
                                            })
                                            : t('uploading')}
                                    </p>

                                    {activeDocId && progressMap[activeDocId] && (
                                        <div className="w-full max-w-xs mt-4">
                                            <div className="bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                <div
                                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${progressMap[activeDocId].percentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                                {t('generatingVectors', { percentage: progressMap[activeDocId].percentage })}
                                            </p>
                                        </div>
                                    )}

                                    {!(activeDocId && progressMap[activeDocId]) && (
                                        <p className="text-xs text-muted-foreground mt-1 text-center">
                                            {t('extractingText')}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 text-gray-400 mb-4" />
                                    <p className="text-sm font-medium">
                                        {isDragActive ? t('dropActive') : t('dropInactive')}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('fileLimits')}</p>
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
                        {t('knowledgeBaseTitle')}
                    </CardTitle>
                    <CardDescription>
                        {t('knowledgeBaseDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {documents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground italic">
                            {t('noDocuments')}
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
                                                            <CheckCircle2 className="h-3 w-3" /> {t('statusReady')}
                                                        </span>
                                                    ) : doc.status === 'processing' || progressMap[doc.id] ? (
                                                        <span className="text-blue-600 flex items-center gap-1">
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                            {progressMap[doc.id]
                                                                ? `${progressMap[doc.id].current}/${progressMap[doc.id].total} ${t('statusProcessing').toLowerCase()}`
                                                                : t('statusProcessing')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 flex items-center gap-0.5">
                                                            <AlertCircle className="h-3 w-3" /> {t('statusError')}
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
