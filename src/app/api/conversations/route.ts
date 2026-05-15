import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
  });

  return Response.json(conversations);
}
