import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { phoneNumber: phone },
    include: {
      messages: {
        orderBy: { timestamp: "asc" },
      },
    },
  });

  if (!conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  return Response.json(conversation);
}
