type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;
const MAX_OAUTH_PER_IP = 30;
const MAX_PASSWORD_CHANGE = 8;

export function clientIpFrom(headersList: Headers) {
  const vercel = headersList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    return parts.at(-1) || "unknown";
  }
  return headersList.get("x-real-ip")?.trim() || "local";
}

function prune(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function hit(key: string, max: number, now: number) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count > max) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfter: 0 };
}

export function loginAllowed(ip: string, email: string) {
  const now = Date.now();
  prune(now);
  const byEmail = hit(`e:${email}`, MAX_PER_EMAIL, now);
  const byIp = hit(`i:${ip}`, MAX_PER_IP, now);
  if (!byEmail.ok || !byIp.ok) {
    return {
      ok: false,
      retryAfter: Math.max(byEmail.retryAfter, byIp.retryAfter),
    };
  }
  return { ok: true, retryAfter: 0 };
}

export function clearLoginFailures(ip: string, email: string) {
  buckets.delete(`e:${email}`);
  buckets.delete(`i:${ip}`);
}

export function oauthAllowed(ip: string) {
  const now = Date.now();
  prune(now);
  return hit(`o:${ip}`, MAX_OAUTH_PER_IP, now);
}

export function passwordChangeAllowed(ip: string, email: string) {
  const now = Date.now();
  prune(now);
  const byEmail = hit(`p:${email}`, MAX_PASSWORD_CHANGE, now);
  const byIp = hit(`pi:${ip}`, MAX_PASSWORD_CHANGE, now);
  if (!byEmail.ok || !byIp.ok) {
    return {
      ok: false,
      retryAfter: Math.max(byEmail.retryAfter, byIp.retryAfter),
    };
  }
  return { ok: true, retryAfter: 0 };
}
