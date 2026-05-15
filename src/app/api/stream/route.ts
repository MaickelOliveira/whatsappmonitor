import { NextRequest } from "next/server";
import emitter from "@/lib/emitter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected
        }
      };

      send({ type: "connected" });

      const onMessage = (payload: { conversation: { phoneNumber: string }; message: unknown }) => {
        if (!phone || payload.conversation.phoneNumber === phone) {
          send({ type: "new_message", ...payload });
        }
      };

      emitter.on("message", onMessage);

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
          emitter.off("message", onMessage);
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        emitter.off("message", onMessage);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
