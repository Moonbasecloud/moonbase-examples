// The migration command named in moonbase.json. moonbase runs it once per
// deploy, inside the built app, before the new version goes live. It is safe
// to run again: it only creates what is missing. On failure it prints the real
// error to standard error and exits non-zero, so the deploy stops and says why.
const { createPool } = require("./db");

async function main() {
  const pool = createPool();
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 200),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes (created_at DESC)");
    console.log("migration ok: notes is ready");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
