// A small in-memory limit on saving notes: each visitor address may save a few
// notes per window. It lives in this one process, so it resets when the app
// restarts or sleeps, and it is not shared between several running copies.
// That is enough for a demo; a busy app needs a shared store instead.
//
// The address comes from X-Real-IP, which moonbase's proxy sets to the address
// it received the request from (it replaces any value the visitor sent).

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED = 10_000;

function table() {
  if (!globalThis.__moonbaseNotesHits) globalThis.__moonbaseNotesHits = new Map();
  return globalThis.__moonbaseNotesHits;
}

function sweep(hits, now) {
  for (const [address, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(address);
  }
}

// Returns 0 when the address may save now, otherwise the seconds to wait.
function takeSlot(address, now = Date.now()) {
  const hits = table();
  let entry = hits.get(address);
  if (!entry || entry.resetAt <= now) {
    if (hits.size >= MAX_TRACKED) sweep(hits, now);
    if (hits.size >= MAX_TRACKED) hits.clear();
    entry = { count: 0, resetAt: now + WINDOW_MS };
    hits.set(address, entry);
  }
  entry.count += 1;
  return entry.count > LIMIT ? Math.ceil((entry.resetAt - now) / 1000) : 0;
}

module.exports = { takeSlot, LIMIT, WINDOW_MS };
