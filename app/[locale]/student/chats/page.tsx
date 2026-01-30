import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Navbar } from '@/components/ui/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function ChatsHistoryPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'STUDENT') {
        redirect('/login');
    }

    const userChats = await db.query.chats.findMany({
        where: eq(chats.userId, session.user.id),
        with: {
            assistant: {
                columns: {
                    id: true,
                    name: true,
                },
            },
            messages: {
                orderBy: (messages, { desc }) => [desc(messages.createdAt)],
                limit: 1,
            },
        },
        orderBy: (chats, { desc }) => [desc(chats.updatedAt)],
    });

    return (
        <>
            <Navbar user={session.user} />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">
                            Historial de Chats
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Revisa tus conversaciones anteriores con los asistentes
                        </p>
                    </div>

                    {/* Chats List */}
                    {userChats.length === 0 ? (
                        <Card>
                            <CardContent className="pt-12 pb-12 text-center">
                                <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No tienes chats aún
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Empieza una conversación con un asistente para verla aquí
                                </p>
                                <Link href="/student">
                                    <Button>Ver Asistentes</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {userChats.map((chat) => {
                                const lastMessage = chat.messages[0];
                                const preview = lastMessage
                                    ? lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : '')
                                    : 'Sin mensajes';

                                return (
                                    <Card key={chat.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-lg mb-1">
                                                        {chat.title}
                                                    </CardTitle>
                                                    <CardDescription className="flex items-center gap-2 text-sm">
                                                        <MessageSquare className="h-4 w-4" />
                                                        {chat.assistant.name}
                                                        <span>•</span>
                                                        <Clock className="h-4 w-4" />
                                                        {formatDistanceToNow(new Date(chat.updatedAt), {
                                                            addSuffix: true,
                                                            locale: es,
                                                        })}
                                                    </CardDescription>
                                                </div>
                                                <form action={`/api/chats?id=${chat.id}`} method="DELETE">
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600 mb-4">{preview}</p>
                                            <Link href={`/chat/${chat.assistantId}?chatId=${chat.id}`}>
                                                <Button variant="outline" size="sm">
                                                    Continuar Conversación
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
