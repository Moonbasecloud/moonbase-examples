# moonbase examples

[![CI](https://github.com/Moonbasecloud/moonbase-examples/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Moonbasecloud/moonbase-examples/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) · [Docs](https://moonbase.cloud/docs/deploy-from-ai-chat?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch)

**AI built your app. moonbase runs everything else.**

Hosting, database, domains, analytics, rollbacks, team access — all in one platform, all run by your AI agent.

### → [moonbase.cloud](https://moonbase.cloud/?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch)

This repository holds three small apps that deploy to moonbase as they are. Each one saves its data in a moonbase managed PostgreSQL database, is short enough to read in a few minutes, and has a one-line prompt you paste into your AI agent to put it online. After that you manage it from the same chat.

| Example | What it shows | Kind |
|---|---|---|
| [`event-rsvp`](event-rsvp/) | An event page where guests RSVP, with an owner view of the headcount. The app from the quick start on the [moonbase GitHub page](https://github.com/Moonbasecloud), with its first prompt and one follow-up change from the same chat. [Live demo](https://gh-example-event-rsvp.moonbase.host) | Node server + database |
| [`express-guestbook`](express-guestbook/) | A Node/Express app that saves entries in a moonbase managed PostgreSQL database. [Live demo](https://gh-example-express-guestbook.moonbase.host) | Node server + database |
| [`nextjs-minimal`](nextjs-minimal/) | A small Next.js app that saves notes in a moonbase managed PostgreSQL database. [Live demo](https://gh-example-nextjs-minimal.moonbase.host) | Next.js + database |

## Before you start

1. **A moonbase account.** [Sign up](https://app.moonbase.cloud/register?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch) and verify your email.
2. **The moonbase connector in your AI tool.** Add a connector with this address and sign in when the tool opens the moonbase window:

   ```text
   https://app.moonbase.cloud/mcp
   ```

   Setup steps for Claude, ChatGPT, Cursor and other tools are in [Deploy from any AI chat](https://moonbase.cloud/docs/deploy-from-ai-chat?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch). No API key is involved on this path.
3. **The example's files where your agent can read them.** Clone this repository and open it in your agent (Claude Code, Cursor), or attach the example's folder to the chat.

## Deploy with your AI agent

Paste the prompt from the example's own README. For instance, for the guestbook with its database:

```text
Deploy the express-guestbook folder to moonbase with the managed PostgreSQL database its moonbase.json asks for, and give me the live link.
```

Depending on its settings, your assistant may ask you to confirm before it deploys. When the deploy finishes you get a live HTTPS address.

There is no deploy button here on purpose: a moonbase deploy goes through your agent, through an upload on moonbase itself, or through the API.

## Manage it from chat

Keep talking to the same agent. It uses a moonbase connector tool for each of these; nothing needs a terminal.

| Paste this | What the agent does |
|---|---|
| `Is my guestbook live? Check its status and its database.` | Calls `deploy_status`: whether it is live, the current version, the live address and the database. |
| `Show me the recent deploys of my guestbook and why any of them failed.` | Calls `deploy_logs`: the recent deploys, their status and moonbase's explanation of a failed one. |
| `Add a page that lists the newest entries first, then deploy it.` | Changes the code and calls `deploy`. The database migration runs before the new version goes live. |
| `Roll back my guestbook to the previous version.` | Calls `list_versions` to find it, then `rollback`. |
| `Connect guestbook.example.com to my guestbook.` | Calls `add_domain` and tells you the DNS record that proves you own the domain. |
| `Export my guestbook database.` | Calls `export_database` and gives you the link to your database's export page, where you download it when your project's Database page offers export. |

`deploy_logs` shows the deploy history and why a deploy failed. It does not show the logs of your running app.

A rollback puts an earlier version's code back live. It does not undo rows already saved in the database.

## Other ways to deploy

- **By hand.** ZIP the example's folder (leave out `node_modules` and build output) and upload it as a new project with the **+ New mission** button in moonbase. See [Getting Started](https://moonbase.cloud/docs/getting-started?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).
- **From CI.** See [Deploying from GitHub Actions](https://moonbase.cloud/docs/github-actions-ci-cd?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).

## What to know

- An app must listen on the `PORT` environment variable. Every example here does.
- The container's own disk does not keep data between deploys. Every example here keeps its data in a database for that reason.
- A managed PostgreSQL database is optional and included on every plan, Free included: up to one per project, inside the plan's storage. A project asks for one with a `moonbase.json` file, as every example here does.
- Plans and limits: [Pricing](https://moonbase.cloud/pricing?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).

## License

MIT. See [LICENSE](LICENSE).
