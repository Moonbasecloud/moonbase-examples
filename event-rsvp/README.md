# Event page with RSVPs and a managed database

An event page for the Riverbend Summer Picnic where guests RSVP. Their RSVPs are saved in a moonbase managed PostgreSQL database. This is the app from the quick start on the [moonbase GitHub page](https://github.com/Moonbasecloud), followed from the first prompt to the live result. Riverbend and its picnic are made up; change `event.js` to make it your own event.

## 1. The first prompt

```text
Build me an event page for the Riverbend Summer Picnic where guests can RSVP, with a database for guests, and put it live on moonbase.
```

## 2. What you get

- **An event page** with the date, the time, the place and a short description.
- **An RSVP form** with name, email and the number of guests (up to 6, the guest included). Sending it again with the same email updates that RSVP instead of adding a second one.
- **A confirmation** after sending, with what was saved.
- **An owner view** at `/owner` with the headcount, the number of RSVPs and the guest list. It opens only with the owner key (see [The owner key](#the-owner-key)).
- **A managed PostgreSQL database** with a `guests` table, created by the migration in `migrate.js` on the first deploy.

```text
event-rsvp/
  moonbase.json      asks moonbase for a database and names the migration command
  migrate.js         the database changes, one per step, each applied once
  db.js              the connection pool, with the TLS settings moonbase requires
  event.js           the event details, the largest party and the menu
  server.js          the Express app: the pages, the RSVP form, the owner view and /readyz
  views.js           the HTML pages
  rate-limit.js      a small per-address limit on sending the forms
  public/            the stylesheet and form.js
```

## 3. Then, from the same chat

```text
Add a meal choice for each guest
```

This folder holds the app after this second step. Everything that belongs to it is marked `Step 2` in the code, so you can see what the second prompt changed.

| | After the first prompt | After "Add a meal choice for each guest" |
|---|---|---|
| Database | `guests`: name, email, number of guests | The same table with a new `meals` column: one meal for each person in the party |
| RSVP form | Name, email, number of guests | The same, plus one meal choice for each guest. `public/form.js` shows as many choices as the party has |
| Confirmation | What was saved | The same, plus each guest's meal |
| Owner view | Headcount and guest list | The same, plus **Meals to order**: a total for each meal and the guests who have not chosen yet |

The change to the database is its own migration in `migrate.js`, after the first one:

```js
{
  // Step 2, from the same chat: "Add a meal choice for each guest".
  id: "002_add_meal_choice",
  sql: `
    ALTER TABLE guests ADD COLUMN meals TEXT[];
    ALTER TABLE guests ADD CONSTRAINT guests_one_meal_per_guest
      CHECK (meals IS NULL OR cardinality(meals) = party_size);
  `,
},
```

`migrate.js` records each migration it applies in a `schema_migrations` table, so on the next deploy only `002_add_meal_choice` runs. RSVPs saved before the change keep their guests and have no meals yet; the owner view counts those guests under **Not chosen yet**, and a guest who sends the form again picks meals then. The menu itself is the `MEALS` list in `event.js`.

## 4. Deploy it

### With your AI agent

With the moonbase connector connected (see the [repository README](../README.md#before-you-start)), open this repository in your agent and paste:

```text
Deploy the event-rsvp folder to moonbase with the managed PostgreSQL database its moonbase.json asks for, and give me the live link.
```

On each deploy moonbase runs the `migrate` command inside the built app before the new version goes live. If it fails, the deploy stops and a version that was already live stays live. If moonbase cannot create the database, the deploy result says so; the app then stops at start and names the missing settings, and it never runs without its database.

### By hand

ZIP the `event-rsvp` folder (leave out `node_modules`) and upload it as a new project with the **+ New mission** button in moonbase. See [Getting Started](https://moonbase.cloud/docs/getting-started?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).

### The owner key

The owner view is protected by the `OWNER_KEY` environment variable. Its value is not in the code: you choose it and set it on moonbase.

| Variable | What it is |
|---|---|
| `OWNER_KEY` | The key that opens `/owner`. At least 12 characters; use a long random value. Until it is set, `/owner` says the owner view is off. |

Set it on the project's **Environment Variables** page in moonbase and type the value there, not in the chat. A change takes effect with the next deploy, so use **Save and redeploy**. See [Environment Variables](https://moonbase.cloud/docs/environment-variables?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).

To open the owner view, go to `/owner` on your live address and enter the key. The key travels in the form, never in the address. Each visitor address gets 10 tries per 10 minutes.

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

moonbase gives the migration command and the running app the same three environment variables. You do not set them yourself:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | User, password, host, port and database. It carries no TLS settings. Use it as given and do not add `sslmode` to it. |
| `PILOT_DB_CA_FILE` | The path of the certificate file (PEM) that signed the database server's certificate. |
| `PILOT_DB_SERVER_NAME` | The name on the database server's certificate. The host inside `DATABASE_URL` can be different. |

`db.js` connects with the TLS recipe from the moonbase build guide, the same as the [guestbook example](../express-guestbook/README.md#the-tls-recipe): certificate verification stays on, `checkServerIdentity` checks the name from `PILOT_DB_SERVER_NAME`, and the pool keeps 3 connections or fewer.

## Manage it from chat

Keep talking to the same agent. It uses a moonbase connector tool for each of these; nothing needs a terminal.

| Paste this | What the agent does |
|---|---|
| `Is my RSVP page live? Check its status and its database.` | Calls `deploy_status`: whether it is live, the current version, the live address and the database. |
| `Show me the recent deploys of my RSVP page and why any of them failed.` | Calls `deploy_logs`: the recent deploys, their status and moonbase's explanation of a failed one. |
| `Roll back my RSVP page to the previous version.` | Calls `list_versions` to find it, then `rollback`. |
| `Connect picnic.example.com to my RSVP page.` | Calls `add_domain` and tells you the DNS record that proves you own the domain. |
| `Export my RSVP database.` | Calls `export_database` and gives you the link to your database's export page, where you download it. |

A rollback puts an earlier version's code back live. It does not undo database changes: after rolling back past step 2, the `meals` column stays and the older code ignores it.

## Run it locally

Without database settings the app stops at once and names what is missing. To run it fully you need a local PostgreSQL that accepts TLS connections, the CA file that signed its certificate, and the name on that certificate:

```bash
cd event-rsvp
npm install
export DATABASE_URL="postgres://localhost:5432/rsvp"   # add your local user and password to this address
export PILOT_DB_CA_FILE="/path/to/ca.pem"
export PILOT_DB_SERVER_NAME="name-on-the-server-certificate"
export OWNER_KEY="a-long-random-value-for-local-use"
npm run migrate
npm start
```

Then open `http://localhost:3000`, and `http://localhost:3000/owner` for the owner view. Keep real connection strings and keys out of the repository.

## How it behaves

- `GET /readyz` answers `200` after one successful `SELECT 1` and `503` while the database cannot be reached. moonbase asks this path after a deploy.
- `POST /rsvp` takes the form: name up to 80 characters, an email address, 1 to 6 guests and a meal for each guest. Each visitor address can send it 10 times per 10 minutes; after that it answers `429` with a `Retry-After` header. The count is kept in the app's memory, so it starts again when the app restarts or sleeps.
- One RSVP per email address, compared without case. Sending again replaces the name, the number of guests and the meals.
- Queries bind their values as parameters, and every page writes visitors' text as text, never as HTML.
- The owner view is not cached and asks search engines not to index it. Anyone with the owner key sees the guest list, emails included, so share the key only with people who should.
- No email is sent to guests. This is a demo: it has no sign-in for guests, no spam filter and no way for a guest to cancel other than asking the owner.

More: [Getting Started](https://moonbase.cloud/docs/getting-started?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch) and [Environment Variables](https://moonbase.cloud/docs/environment-variables?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).
