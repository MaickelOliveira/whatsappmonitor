import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import emitter from "@/lib/emitter";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-api-secret");
  if (secret !== process.env.API_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // strip leading "=" that n8n sometimes adds to expression values
  const clean = (v: unknown) => (typeof v === "string" ? v.replace(/^=/, "") : v);

  const phoneNumber = clean(body.phoneNumber) as string;
  const contactName = clean(body.contactName) as string | undefined;
  const content = clean(body.content) as string;
  const direction = clean(body.direction) as string;
  const senderType = clean(body.senderType) as string;
  const waMessageId = clean(body.waMessageId) as string | undefined;
  const timestamp = clean(body.timestamp) as string | undefined;

  if (!phoneNumber || !content || !direction || !senderType) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const parsedTime = timestamp ? new Date(timestamp) : null;
  const msgTime = parsedTime && !isNaN(parsedTime.getTime()) ? parsedTime : new Date();

  const conversation = await prisma.conversation.upsert({
    where: { phoneNumber },
    update: { lastMessageAt: msgTime, ...(contactName ? { contactName } : {}) },
    create: { phoneNumber, contactName: contactName ?? null, lastMessageAt: msgTime },
  });

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content,
      direction,
      senderType,
      waMessageId: waMessageId ?? null,
      timestamp: msgTime,
    },
  });

  emitter.emit("message", { conversation, message });

  return Response.json({ ok: true, messageId: message.id });
}
