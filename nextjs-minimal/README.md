# Next.js notes app with a managed database

A small Next.js app (App Router) where visitors write short notes. Each note is saved in a moonbase managed PostgreSQL database, and the page reads the newest notes from it on every request. moonbase detects Next.js, installs the dependencies, builds the app, runs the migration and starts it.

Live demo: <https://gh-example-nextjs-minimal.moonbase.host>

```text
nextjs-minimal/
  moonbase.json        asks moonbase for a database and names the migration command
  migrate.js           creates the notes table (safe to run again)
  db.js                the connection pool, with the TLS settings moonbase requires
  rate-limit.js        a small per-address limit on saving notes
  app/page.js          the home page: the newest notes, read from the database on each request
  app/note-form.js     the form for a new note
  app/actions.js       the server action that saves a note
  app/readyz/route.js  answers moonbase's readiness check with a database SELECT 1
  next.config.mjs
  package.json
```

## The database

A managed PostgreSQL database is optional on moonbase and included on every plan, Free included: up to one per project, inside the plan's storage. This example asks for one with `moonbase.json`, the same file the [guestbook](../express-guestbook/) uses:

```json
{
  "database": {
    "engine": "postgresql",
    "migrate": "node migrate.js"
  }
}
```

On each deploy moonbase runs the `migrate` command inside the built app before the new version goes live. If it fails, the deploy stops and a version that was already live stays live.

moonbase gives the migration command and the running app three environment variables, `DATABASE_URL`, `PILOT_DB_CA_FILE` and `PILOT_DB_SERVER_NAME`. You do not set them yourself. `db.js` connects with the TLS recipe from the moonbase build guide, the same code as the guestbook's; the [guestbook README](../express-guestbook/README.md#the-database) explains each variable and the recipe. The pool is created on first use, so `next build` does not need a database.

Two things in `package.json` matter for hosting:

- `"start": "next start -p ${PORT:-3000}"`: the app listens on the `PORT` moonbase sets, and on 3000 when you run it yourself.
- `"build": "next build"`: moonbase builds fresh, so `.next/` and `node_modules/` are not uploaded.

## Deploy with your AI agent

With the moonbase connector connected (see the [repository README](../README.md#before-you-start)), open this repository in your agent and paste:

```text
Deploy the nextjs-minimal folder to moonbase with the managed PostgreSQL database its moonbase.json asks for, and give me the live link.
```

If moonbase cannot create the database, the deploy result says so. The page then says it has no database settings, and `/readyz` answers `503`.

## Manage it from chat

Keep talking to the same agent. It uses a moonbase connector tool for each of these; nothing needs a terminal.

| Paste this | What the agent does |
|---|---|
| `Is my notes app live? Check its status and its database.` | Calls `deploy_status`: whether it is live, the current version, the live address and the database. |
| `Show me the recent deploys of my notes app and why any of them failed.` | Calls `deploy_logs`: the recent deploys, their status and moonbase's explanation of a failed one. |
| `Let visitors delete their own note, then deploy it.` | Changes the code and calls `deploy`. The migration runs before the new version goes live. |
| `Roll back my notes app to the previous version.` | Calls `list_versions` to find it, then `rollback`. |
| `Connect notes.example.com to my notes app.` | Calls `add_domain` and tells you the DNS record that proves you own the domain. |
| `Export my notes app's database.` | Calls `export_database` and gives you the link to your database's export page, where you download it. |

`deploy_logs` shows the deploy history and why a deploy failed. It does not show the logs of your running app.

A rollback puts an earlier version's code back live. It does not undo rows already saved in the database.

## Run it locally

Needs Node.js 20.9 or newer, a local PostgreSQL that accepts TLS connections, the CA file that signed its certificate, and the name on that certificate. The app keeps certificate verification on locally too:

```bash
cd nextjs-minimal
npm install
export DATABASE_URL="postgres://localhost:5432/notes"   # add your local user and password to this address
export PILOT_DB_CA_FILE="/path/to/ca.pem"
export PILOT_DB_SERVER_NAME="name-on-the-server-certificate"
npm run migrate
npm run build
npm start
```

Then open `http://localhost:3000`. Without the database settings the app still builds and starts, and the page says the settings are missing. Keep real connection strings out of the repository. For development with live reload, use `npm run dev`.

## How it behaves

- `GET /readyz` answers `200` after one successful `SELECT 1` and `503` while the database cannot be reached. moonbase asks this path after a deploy.
- A note is 1 to 200 characters. The value is bound as a query parameter, and React writes notes as text, never as HTML.
- Each visitor address can save 5 notes per 10 minutes. The count is kept in the app's memory, so it starts again when the app restarts or sleeps.
- This is a demo: apart from that limit it has no sign-in, no spam filter and no moderation. Add those before you use it for real visitors.

## Good to know

- Values in `NEXT_PUBLIC_*` variables reach the browser. Never put a secret in one.
- On the free plan a server app sleeps after a while with no visitors and wakes on the next request, so the first load after a quiet period is slower.

More: [Getting Started](https://moonbase.cloud/docs/getting-started?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch), [Environment Variables](https://moonbase.cloud/docs/environment-variables?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch) and [Sleep & Wake](https://moonbase.cloud/docs/sleeping-sites?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).
