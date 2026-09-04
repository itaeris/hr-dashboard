export function turnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

export async function verifyTurnstileToken(token: string, ip?: string) {
  if (!turnstileSiteKey()) return true;
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  const response = token.trim();
  if (!secret || !response) return false;

  const body = new URLSearchParams({
    secret,
    response,
  });
  if (ip && ip !== "local" && ip !== "unknown") body.set("remoteip", ip);

  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = (await result.json()) as { success?: boolean };
    return payload.success === true;
  } catch {
    return false;
  }
}
