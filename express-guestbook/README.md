# Express guestbook with a managed database

A Node/Express app where visitors leave a name and a message. Entries are saved in a moonbase managed PostgreSQL database.

Live demo: <https://gh-example-express-guestbook.moonbase.host>

```text
express-guestbook/
  moonbase.json      asks moonbase for a database and names the migration command
  migrate.js         creates the table (safe to run again)
  db.js              the connection pool, with the TLS settings moonbase requires
  server.js          the Express app: the page, the API and /readyz
  rate-limit.js      per-address request limits, with the express-rate-limit package
  public/index.html  the guestbook page
```

## The database

A managed PostgreSQL database is optional on moonbase and included on every plan, Free included: up to one per project, inside the plan's storage. This example asks for one with `moonbase.json`:

```json
{
  "database": {
    "engine": "postgresql",
    "migrate": "node migrate.js"
  }
}
```

On each deploy moonbase runs the `migrate` command inside the built app before the new version goes live. If it fails, the deploy stops and a version that was already live stays live.

moonbase gives the migration command and the running app the same three environment variables. You do not set them yourself:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | User, password, host, port and database. It carries no TLS settings. Use it as given and do not add `sslmode` to it. |
| `PILOT_DB_CA_FILE` | The path of the certificate file (PEM) that signed the database server's certificate. |
| `PILOT_DB_SERVER_NAME` | The name on the database server's certificate. The host inside `DATABASE_URL` can be different. |

### The TLS recipe

The managed database refuses a connection that is not encrypted, so `DATABASE_URL` alone does not connect. `db.js` uses the recipe from the moonbase build guide, with the `pg` package:

```js
const fs = require("node:fs");
const tls = require("node:tls");
const { Pool } = require("pg");

const serverName = process.env.PILOT_DB_SERVER_NAME;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  ssl: {
    ca: fs.readFileSync(process.env.PILOT_DB_CA_FILE, "utf8"),
    servername: serverName,
    checkServerIdentity: (_host, cert) => tls.checkServerIdentity(serverName, cert),
    rejectUnauthorized: true,
  },
});
```

Three rules from the same guide:

- Keep `checkServerIdentity`. Without it the driver checks the certificate against the host in `DATABASE_URL`, and the connection fails.
- Never turn verification off (`rejectUnauthorized: false`, `sslmode=require` without a CA, `NODE_TLS_REJECT_UNAUTHORIZED=0`).
- Keep the pool at 3 connections or fewer.

## Deploy with your AI agent

With the moonbase connector connected (see the [repository README](../README.md#before-you-start)), open this repository in your agent and paste:

```text
Deploy the express-guestbook folder to moonbase with the managed PostgreSQL database its moonbase.json asks for, and give me the live link.
```

If moonbase cannot create the database, the deploy result says so. The guestbook then stops at start and names the missing settings; it never runs without its database.

## Manage it from chat

Keep talking to the same agent. It uses a moonbase connector tool for each of these; nothing needs a terminal.

| Paste this | What the agent does |
|---|---|
| `Is my guestbook live? Check its status and its database.` | Calls `deploy_status`: whether it is live, the current version, the live address and the database. |
| `Show me the recent deploys of my guestbook and why any of them failed.` | Calls `deploy_logs`: the recent deploys, their status and moonbase's explanation of a failed one. |
| `Add a page that lists the newest entries first, then deploy it.` | Changes the code and calls `deploy`. The migration runs before the new version goes live. |
| `Roll back my guestbook to the previous version.` | Calls `list_versions` to find it, then `rollback`. |
| `Connect guestbook.example.com to my guestbook.` | Calls `add_domain` and tells you the DNS record that proves you own the domain. |
| `Export my guestbook database.` | Calls `export_database` and gives you the link to your database's export page, where you download it when your project's Database page offers export. |

`deploy_logs` shows the deploy history and why a deploy failed. It does not show the logs of your running app.

A rollback puts an earlier version's code back live. It does not undo rows already saved in the database.

## Run it locally

Without database settings the app stops at once and names what is missing:

```bash
cd express-guestbook
npm install
npm start
# Cannot start the guestbook. Missing database settings: DATABASE_URL, PILOT_DB_CA_FILE, PILOT_DB_SERVER_NAME. ...
```

To run it fully you need a local PostgreSQL that accepts TLS connections, the CA file that signed its certificate, and the name on that certificate. The app keeps certificate verification on locally too:

```bash
export DATABASE_URL="postgres://localhost:5432/guestbook"   # add your local user and password to this address
export PILOT_DB_CA_FILE="/path/to/ca.pem"
export PILOT_DB_SERVER_NAME="name-on-the-server-certificate"
npm run migrate
npm start
```

Then open `http://localhost:3000`. Keep real connection strings out of the repository.

## How it behaves

- `GET /readyz` answers `200` after one successful `SELECT 1` and `503` while the database cannot be reached. moonbase asks this path after a deploy.
- `GET /api/entries` returns the newest 50 entries. `POST /api/entries` takes `{"name", "message"}` as JSON (name up to 40 characters, message up to 280).
- Each visitor address can post 5 entries per 10 minutes; after that `POST /api/entries` answers `429` with a `Retry-After` header. Every address can also make up to 300 requests a minute in all. The counts are kept in the app's memory, so they start again when the app restarts or sleeps.
- Queries bind their values as parameters, and the page writes entries as text, never as HTML.
- This is a demo: apart from that posting limit it has no sign-in, no spam filter and no moderation. Add those before you use it for real visitors.

More: [Getting Started](https://moonbase.cloud/docs/getting-started?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch) and [Environment Variables](https://moonbase.cloud/docs/environment-variables?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).
