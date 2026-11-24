// The migration command named in moonbase.json. moonbase runs it once per
// deploy, inside the built app, before the new version goes live. It is safe
// to run again: it only creates what is missing. On failure it prints the real
// error to standard error and exits non-zero, so the deploy stops and says why.
const { createPool } = require("./db");

async function main() {
  const pool = createPool();
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guestbook_entries (
        id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
        message     TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 280),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query(
      "CREATE INDEX IF NOT EXISTS guestbook_entries_created_at_idx ON guestbook_entries (created_at DESC)",
    );
    console.log("migration ok: guestbook_entries is ready");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
