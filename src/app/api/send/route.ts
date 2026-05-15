import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import emitter from "@/lib/emitter";

export async function POST(req: NextRequest) {
  const { phoneNumber, content } = await req.json();

  if (!phoneNumber || !content) {
    return Response.json({ error: "Missing phoneNumber or content" }, { status: 400 });
  }

  const phoneId = process.env.WA_PHONE_NUMBER_ID;
  const token = process.env.WA_ACCESS_TOKEN;

  if (!phoneId || !token) {
    return Response.json({ error: "WhatsApp credentials not configured" }, { status: 500 });
  }

  const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "text",
      text: { body: content },
    }),
  });

  const waData = await waRes.json();

  if (!waRes.ok) {
    return Response.json({ error: "WhatsApp API error", detail: waData }, { status: 502 });
  }

  const waMessageId = waData.messages?.[0]?.id ?? null;
  const now = new Date();

  const conversation = await prisma.conversation.upsert({
    where: { phoneNumber },
    update: { lastMessageAt: now },
    create: { phoneNumber, lastMessageAt: now },
  });

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content,
      direction: "outgoing",
      senderType: "human",
      waMessageId,
      timestamp: now,
    },
  });

  emitter.emit("message", { conversation, message });

  return Response.json({ ok: true, messageId: message.id });
}
