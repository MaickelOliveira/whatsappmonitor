import { NextRequest } from "next/server";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const validUser = process.env.ADMIN_USERNAME ?? "admin";
  const validPass = process.env.ADMIN_PASSWORD ?? "admin123";

  if (username !== validUser || password !== validPass) {
    return Response.json({ error: "Usuário ou senha incorretos" }, { status: 401 });
  }

  const token = await createSession(username);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `wa_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`,
    },
  });
}
