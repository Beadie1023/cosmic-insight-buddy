// A best-effort speed bump, not real protection. Counts live in this server
// instance's memory, so they reset on restart and are not shared between
// instances. For a hard cap, keep the counts in a database. If the visitor's
// address cannot be determined, requests are allowed rather than blocked.
const hits = new Map<string, number[]>();

export function clientKey(request: Request): string | null {
  const h = request.headers;
  const forwarded = (h.get("x-forwarded-for") ?? "").split(",")[0] ?? "";
  const ip = h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? forwarded.trim();
  return ip ? ip : null;
}

export function isRateLimited(bucket: string, key: string | null, max: number, windowMs: number): boolean {
  if (!key) return false;
  const now = Date.now();
  const id = `${bucket}:${key}`;
  const recent = (hits.get(id) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(id, recent);
    return true;
  }
  recent.push(now);
  hits.set(id, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    }
  }
  return false;
}
