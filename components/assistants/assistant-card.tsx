import { type Assistant } from '@/db/schema';
import { Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface AssistantCardProps {
    assistant: Assistant;
    documentCount?: number;
    userRole?: 'TEACHER' | 'STUDENT' | 'ADMIN';
}

export function AssistantCard({ assistant, documentCount, userRole = 'TEACHER' }: AssistantCardProps) {
    const t = useTranslations('common');
    // Students go to chat, teachers go to management
    const href = userRole === 'STUDENT'
        ? `/chat/${assistant.id}`
        : `/teacher/assistants/${assistant.id}`;

    return (
        <Link href={href} className="block h-full">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary shrink-0" />
                            <CardTitle className="text-lg line-clamp-1">{assistant.name}</CardTitle>
                        </div>
                        {assistant.isPublic === 1 && (
                            <Badge variant="secondary" className="shrink-0">{t('public')}</Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                    {assistant.description ? (
                        <p className="text-gray-600 text-sm line-clamp-3 mb-auto">{assistant.description}</p>
                    ) : (
                        <p className="text-gray-400 text-sm italic mb-auto">Sin descripción</p>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        {assistant.isPublic === 1 ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                {t('public')}
                            </span>
                        ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                {t('private')}
                            </span>
                        )}
                        {/* Show document count if provided */}
                        {documentCount !== undefined && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {documentCount} docs
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
