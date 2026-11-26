const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const { createPool } = require("./db");
const { createRateLimit } = require("./rate-limit");
const { MAX_PARTY, MEALS } = require("./event");
const views = require("./views");

const MAX_NAME = 80;
const MAX_EMAIL = 254;
const MIN_OWNER_KEY = 12;

let pool;
try {
  pool = createPool();
} catch (err) {
  // No database settings: say so plainly and stop, instead of serving an RSVP
  // form that cannot save anything.
  console.error(`Cannot start the RSVP page. ${err.message}`);
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "same-origin");
  next();
});
app.use(express.urlencoded({ extended: false, limit: "4kb" }));
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// A generous limit on every request from one address, on top of the tighter
// limits on the two forms below.
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

app.get("/", (_req, res) => {
  res.send(views.eventPage());
});

function cleanText(value, max) {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length >= 1 && text.length <= max ? text : null;
}

function cleanEmail(value) {
  const email = cleanText(value, MAX_EMAIL);
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function cleanPartySize(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= MAX_PARTY ? n : null;
}

// Step 2 ("Add a meal choice for each guest"): one valid meal per person in
// the party, read from meal_1 .. meal_<party size>.
const MEAL_IDS = new Set(MEALS.map((meal) => meal.id));
function cleanMeals(body, partySize) {
  const meals = [];
  for (let n = 1; n <= partySize; n += 1) {
    const meal = body[`meal_${n}`];
    if (typeof meal !== "string" || !MEAL_IDS.has(meal)) return null;
    meals.push(meal);
  }
  return meals;
}

const limitRsvps = createRateLimit({
  limit: 10,
  windowMs: 10 * 60 * 1000,
  message: "Too many RSVPs from your address.",
});

app.post("/rsvp", limitRsvps, async (req, res) => {
  const body = req.body || {};
  const name = cleanText(body.name, MAX_NAME);
  const email = cleanEmail(body.email);
  const partySize = cleanPartySize(body.party_size);
  const meals = partySize ? cleanMeals(body, partySize) : null;

  let error = "";
  if (!name) error = `Enter your name (1 to ${MAX_NAME} characters).`;
  else if (!email) error = "Enter a valid email address.";
  else if (!partySize) error = `Choose how many guests are coming, from 1 to ${MAX_PARTY}.`;
  else if (!meals) error = partySize === 1 ? "Choose your meal." : `Choose a meal for each of the ${partySize} guests.`;
  if (error) {
    res.status(400).send(views.eventPage({ error, values: body }));
    return;
  }

  try {
    // Values are bound as parameters, never joined into the SQL text. The
    // same email again updates that RSVP instead of adding a second one.
    const { rows } = await pool.query(
      `INSERT INTO guests (name, email, party_size, meals)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ((lower(email))) DO UPDATE
         SET name = EXCLUDED.name,
             party_size = EXCLUDED.party_size,
             meals = EXCLUDED.meals,
             updated_at = now()
       RETURNING name, email, party_size, meals`,
      [name, email, partySize, meals],
    );
    res.send(views.confirmationPage(rows[0]));
  } catch (err) {
    console.error("rsvp failed:", err.message);
    res.status(503).send(views.eventPage({ error: "Your RSVP could not be saved. Try again in a moment.", values: body }));
  }
});

// The owner view: headcount, meal totals and the guest list. It is open only
// with the value of the OWNER_KEY environment variable, which is never in the
// code. The key is sent in the form body, never in the address.
function ownerKey() {
  const key = process.env.OWNER_KEY;
  return key && key.length >= MIN_OWNER_KEY ? key : null;
}

function sameKey(given, expected) {
  // Compare digests so the comparison takes the same time for any input.
  const a = crypto.createHash("sha256").update(String(given)).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

const limitOwner = createRateLimit({
  limit: 10,
  windowMs: 10 * 60 * 1000,
  message: "Too many owner key attempts from your address.",
});

app.use("/owner", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("X-Robots-Tag", "noindex");
  next();
});

app.get("/owner", (_req, res) => {
  if (!ownerKey()) {
    res.status(503).send(views.ownerOffPage());
    return;
  }
  const page = views.ownerLoginPage();
  res.status(page.status).send(page.html);
});

app.post("/owner", limitOwner, async (req, res) => {
  const expected = ownerKey();
  if (!expected) {
    res.status(503).send(views.ownerOffPage());
    return;
  }
  if (typeof req.body?.key !== "string" || !sameKey(req.body.key, expected)) {
    const page = views.ownerLoginPage({ error: "That owner key is not right.", status: 401 });
    res.status(page.status).send(page.html);
    return;
  }
  try {
    const [totals, list, meals] = await Promise.all([
      pool.query(
        `SELECT count(*)::int AS rsvps,
                coalesce(sum(party_size), 0)::int AS headcount,
                coalesce(sum(party_size) FILTER (WHERE meals IS NULL), 0)::int AS not_chosen
           FROM guests`,
      ),
      pool.query(
        "SELECT name, email, party_size, meals, updated_at FROM guests ORDER BY created_at, id",
      ),
      // Step 2: how many of each meal, counting every guest in every party.
      pool.query("SELECT meal, count(*)::int AS n FROM guests, unnest(meals) AS meal GROUP BY meal"),
    ]);
    const mealTotals = Object.fromEntries(meals.rows.map((row) => [row.meal, row.n]));
    res.send(
      views.ownerPage({
        rsvps: totals.rows[0].rsvps,
        headcount: totals.rows[0].headcount,
        notChosen: totals.rows[0].not_chosen,
        guests: list.rows,
        mealTotals,
      }),
    );
  } catch (err) {
    console.error("owner view failed:", err.message);
    const page = views.ownerLoginPage({ error: "The guest list could not be loaded. Try again in a moment.", status: 503 });
    res.status(page.status).send(page.html);
  }
});

// A malformed or oversized form body is the sender's mistake, not a crash.
app.use((err, _req, res, next) => {
  if (err && (err.type === "entity.parse.failed" || err.type === "entity.too.large")) {
    res.status(400).send("The form was too large or could not be read.");
    return;
  }
  next(err);
});

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`event RSVP page listening on port ${port}`);
});

function shutdown() {
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
