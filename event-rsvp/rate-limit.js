// A small in-memory limit: each visitor address may make a few requests of
// one kind per window. It lives in this one process, so it resets when the app
// restarts or sleeps, and it is not shared between several running copies.
// That is enough for a demo; a busy app needs a shared store instead.
//
// The address comes from X-Real-IP, which moonbase's proxy sets to the address
// it received the request from (it replaces any value the visitor sent). When
// you run the app yourself without that proxy, the socket address is used.

function clientAddress(req) {
  const header = req.get("x-real-ip");
  return (header && header.trim()) || req.socket.remoteAddress || "unknown";
}

function createRateLimit({ limit, windowMs, message = "Too many requests from your address.", maxTracked = 10_000 }) {
  const hits = new Map(); // address -> { count, resetAt }

  function sweep(now) {
    for (const [address, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(address);
    }
  }

  const timer = setInterval(() => sweep(Date.now()), windowMs);
  timer.unref();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const address = clientAddress(req);
    let entry = hits.get(address);
    if (!entry || entry.resetAt <= now) {
      // Never let the table grow without bound.
      if (hits.size >= maxTracked) sweep(now);
      if (hits.size >= maxTracked) hits.clear();
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(address, entry);
    }
    entry.count += 1;
    if (entry.count > limit) {
      const seconds = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(seconds));
      res.status(429).json({ error: `${message} Try again in ${seconds} seconds.` });
      return;
    }
    next();
  };
}

module.exports = { createRateLimit, clientAddress };
