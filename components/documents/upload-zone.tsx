'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface UploadZoneProps {
    assistantId: string;
    onUploadComplete?: () => void;
}

interface UploadedFile {
    name: string;
    status: 'uploading' | 'success' | 'error';
    error?: string;
}

export function UploadZone({ assistantId, onUploadComplete }: UploadZoneProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            for (const file of acceptedFiles) {
                setFiles((prev) => [...prev, { name: file.name, status: 'uploading' }]);

                const formData = new FormData();
                formData.append('file', file);
                formData.append('assistantId', assistantId);

                try {
                    const response = await fetch('/api/documents/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error('Upload failed');
                    }

                    setFiles((prev) =>
                        prev.map((f) =>
                            f.name === file.name ? { ...f, status: 'success' } : f
                        )
                    );

                    onUploadComplete?.();
                } catch (error) {
                    setFiles((prev) =>
                        prev.map((f) =>
                            f.name === file.name
                                ? { ...f, status: 'error', error: 'Error al subir el archivo' }
                                : f
                        )
                    );
                }
            }
        },
        [assistantId, onUploadComplete]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
        },
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
            >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                {isDragActive ? (
                    <p className="text-blue-600">Suelta los archivos aquí...</p>
                ) : (
                    <div>
                        <p className="text-gray-700 font-medium">
                            Arrastra archivos aquí o haz clic para seleccionar
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            PDF, DOCX o TXT (máx. 10MB)
                        </p>
                    </div>
                )}
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                            <File className="w-5 h-5 text-gray-500" />
                            <span className="flex-1 truncate text-sm">{file.name}</span>
                            {file.status === 'uploading' && (
                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            )}
                            {file.status === 'success' && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {file.status === 'error' && (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
