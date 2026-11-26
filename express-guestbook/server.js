const path = require("node:path");
const express = require("express");
const { createPool } = require("./db");
const { createRateLimit } = require("./rate-limit");

const MAX_NAME = 40;
const MAX_MESSAGE = 280;
const PAGE_SIZE = 50;
// Each visitor address may save 5 entries per 10 minutes.
const POST_LIMIT = 5;
const POST_WINDOW_MS = 10 * 60 * 1000;

let pool;
try {
  pool = createPool();
} catch (err) {
  // No database settings: say so plainly and stop, instead of serving a
  // guestbook that cannot save anything.
  console.error(`Cannot start the guestbook. ${err.message}`);
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "4kb" }));
app.use(express.static(path.join(__dirname, "public")));

// A generous limit on every request from one address, on top of the tighter
// limit on posting below.
app.use(createRateLimit({ limit: 300, windowMs: 60 * 1000 }));

// moonbase asks /readyz after a deploy to learn whether the app is really
// serving: 2xx when ready, 503 while it is not.
app.get("/readyz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ready: true });
  } catch (err) {
    console.error("readiness check failed:", err.message);
    res.status(503).json({ ready: false });
  }
});

app.get("/api/entries", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, message, created_at FROM guestbook_entries ORDER BY created_at DESC, id DESC LIMIT $1",
      [PAGE_SIZE],
    );
    res.json({ entries: rows });
  } catch (err) {
    console.error("list failed:", err.message);
    res.status(503).json({ error: "The guestbook is not available right now." });
  }
});

function cleanText(value, max) {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length >= 1 && text.length <= max ? text : null;
}

const limitPosts = createRateLimit({
  limit: POST_LIMIT,
  windowMs: POST_WINDOW_MS,
  message: "Too many entries from your address.",
});

app.post("/api/entries", limitPosts, async (req, res) => {
  const name = cleanText(req.body?.name, MAX_NAME);
  const message = cleanText(req.body?.message, MAX_MESSAGE);
  if (!name || !message) {
    res.status(400).json({
      error: `Send a name (1 to ${MAX_NAME} characters) and a message (1 to ${MAX_MESSAGE} characters).`,
    });
    return;
  }
  try {
    // Values are bound as parameters, never joined into the SQL text.
    const { rows } = await pool.query(
      "INSERT INTO guestbook_entries (name, message) VALUES ($1, $2) RETURNING id, name, message, created_at",
      [name, message],
    );
    res.status(201).json({ entry: rows[0] });
  } catch (err) {
    console.error("insert failed:", err.message);
    res.status(503).json({ error: "The entry could not be saved. Try again in a moment." });
  }
});

// A malformed or oversized JSON body is the sender's mistake, not a crash.
app.use((err, _req, res, next) => {
  if (err && (err.type === "entity.parse.failed" || err.type === "entity.too.large")) {
    res.status(400).json({ error: "The request body must be a small JSON object." });
    return;
  }
  next(err);
});

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`guestbook listening on port ${port}`);
});

function shutdown() {
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
