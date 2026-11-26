// Per-address request limits, built on the express-rate-limit package. Counts
// live in this one process, so they reset when the app restarts or sleeps, and
// they are not shared between several running copies. That is enough for a
// demo; a busy app needs a shared store instead.
//
// The address comes from X-Real-IP, which moonbase's proxy sets to the address
// it received the request from (it replaces any value the visitor sent). When
// you run the app yourself without that proxy, the socket address is used.
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

function clientAddress(req) {
  const header = req.get("x-real-ip");
  return (header && header.trim()) || req.socket.remoteAddress || "unknown";
}

function createRateLimit({ limit, windowMs, message = "Too many requests from your address." }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // ipKeyGenerator groups an IPv6 address with its /56 block, so one
    // visitor cannot get around the limit by changing the end of the address.
    keyGenerator: (req) => ipKeyGenerator(clientAddress(req)),
    // The address is read from X-Real-IP above, not from X-Forwarded-For.
    validate: { xForwardedForHeader: false },
    handler: (req, res, _next, options) => {
      const resetAt = req.rateLimit?.resetTime?.getTime?.() ?? Date.now() + windowMs;
      const seconds = Math.max(Math.ceil((resetAt - Date.now()) / 1000), 1);
      res.set("Retry-After", String(seconds));
      res.status(options.statusCode).json({ error: `${message} Try again in ${seconds} seconds.` });
    },
  });
}

module.exports = { createRateLimit, clientAddress };
