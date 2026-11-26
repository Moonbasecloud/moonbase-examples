// The migration command named in moonbase.json. moonbase runs it once per
// deploy, inside the built app, before the new version goes live.
//
// Each change to the database is one entry in MIGRATIONS, applied in order and
// recorded in the schema_migrations table, so every deploy applies only the
// ones that are new. Each runs in its own transaction: if one fails, nothing of
// it is kept, the error goes to standard error, the command exits non-zero and
// the deploy stops, so a version that was already live stays live.
const { createPool } = require("./db");

const MIGRATIONS = [
  {
    // Step 1, the first prompt: "Build me an event page for the Riverbend
    // Summer Picnic where guests can RSVP, with a database for guests, and put
    // it live on moonbase."
    id: "001_create_guests",
    sql: `
      CREATE TABLE guests (
        id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
        email       TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
        party_size  INTEGER NOT NULL CHECK (party_size BETWEEN 1 AND 6),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      -- One RSVP per email address: sending the form again updates it.
      CREATE UNIQUE INDEX guests_email_key ON guests (lower(email));
    `,
  },
  {
    // Step 2, from the same chat: "Add a meal choice for each guest".
    // One meal per person in the party, so the list has party_size entries.
    // RSVPs saved before this step keep meals empty (NULL): the owner view
    // counts those guests as "not chosen yet".
    id: "002_add_meal_choice",
    sql: `
      ALTER TABLE guests ADD COLUMN meals TEXT[];
      ALTER TABLE guests ADD CONSTRAINT guests_one_meal_per_guest
        CHECK (meals IS NULL OR cardinality(meals) = party_size);
    `,
  },
];

async function main() {
  const pool = createPool();
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    for (const migration of MIGRATIONS) {
      await client.query("BEGIN");
      try {
        // Only one migration run at a time, even if two deploys overlap.
        await client.query("SELECT pg_advisory_xact_lock(hashtext('event-rsvp-migrations'))");
        const done = await client.query("SELECT 1 FROM schema_migrations WHERE id = $1", [migration.id]);
        if (done.rowCount > 0) {
          await client.query("COMMIT");
          console.log(`migration ${migration.id}: already applied`);
          continue;
        }
        await client.query(migration.sql);
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration.id]);
        await client.query("COMMIT");
        console.log(`migration ${migration.id}: applied`);
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        err.message = `migration ${migration.id} failed: ${err.message}`;
        throw err;
      }
    }
    console.log("migration ok: the guests table is ready");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
