import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("wa_session")?.value;
  if (!token || !(await verifySession(token))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api/auth|api/log|api/send|api/stream|api/conversations|_next/static|_next/image|favicon\\.ico).*)"],
};
