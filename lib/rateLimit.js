// Best-effort rate limiting for a serverless environment.
// Serverless functions can spin up multiple instances, so this is NOT a
// perfectly accurate global limit — but it stops obvious abuse/runaway
// costs on a single warm instance without needing an external database.
// For strict, accurate limiting across all instances, swap this for
// Vercel KV, Upstash Redis, or a similar shared store.

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 30;

const hits = new Map(); // ip -> [timestamps]

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);

  // Occasionally clean up old entries so the Map doesn't grow forever
  if (hits.size > 5000) {
    for (const [key, arr] of hits) {
      if (arr.every((t) => now - t > WINDOW_MS)) hits.delete(key);
    }
  }

  return timestamps.length > MAX_REQUESTS;
}

module.exports = { isRateLimited };
