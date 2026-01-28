import { type Assistant } from '@/db/schema';
import { Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface AssistantCardProps {
    assistant: Assistant;
    documentCount?: number;
    userRole?: 'TEACHER' | 'STUDENT' | 'ADMIN';
}

export function AssistantCard({ assistant, documentCount, userRole = 'TEACHER' }: AssistantCardProps) {
    // Students go to chat, teachers go to management
    const href = userRole === 'STUDENT'
        ? `/chat/${assistant.id}`
        : `/teacher/assistants/${assistant.id}`;

    return (
        <Link href={href}>
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
                </CardHeader>

                <CardContent>
                    {assistant.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{assistant.description}</p>
                    )}

                    <div className="flex items-center gap-2">
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
                </CardContent>
            </Card>
        </Link>
    );
}
