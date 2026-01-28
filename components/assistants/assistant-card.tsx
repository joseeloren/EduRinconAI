import { type Assistant } from '@/db/schema';
import { MessageSquare, FileText } from 'lucide-react';
import Link from 'next/link';

interface AssistantCardProps {
    assistant: Assistant;
    documentCount?: number;
}

export function AssistantCard({ assistant, documentCount }: AssistantCardProps) {
    return (
        <Link href={`/teacher/assistants/${assistant.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{assistant.name}</CardTitle>
                        </div>
                        {assistant.isPublic === 1 && (
                            <Badge variant="secondary">Público</Badge>
                        )}
                    </div>
                </div>

                {assistant.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{assistant.description}</p>
                )}

                <div className="mt-4 flex items-center gap-2">
                    {assistant.isPublic === 1 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Público
                        </span>
                    ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            Privado
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
