const encoder = new TextEncoder();

function getSecret() {
  return process.env.SESSION_SECRET ?? "change-this-in-production";
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSession(username: string): Promise<string> {
  const payload = btoa(JSON.stringify({ u: username, t: Date.now() }));
  const key = await getKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${payload}.${sigB64}`;
}

export async function verifySession(token: string): Promise<boolean> {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await getKey(getSecret());
    const sigBytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
  } catch {
    return false;
  }
}
