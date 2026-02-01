import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ chatId: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { chatId } = await params;
    const { isPublic } = await req.json();

    // Verify ownership
    const [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

    if (!chat || chat.userId !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    await db
        .update(chats)
        .set({ isPublic: isPublic ? 1 : 0 })
        .where(eq(chats.id, chatId));

    return NextResponse.json({ success: true });
}
