# moonbase examples

**AI built your app. moonbase runs everything else.**

Hosting, database, domains, forms, analytics, uptime alerts, rollbacks, team access — and more. All in one platform, all run by your AI agent.

### → [moonbase.cloud](https://moonbase.cloud/?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch)

This repository holds three small projects that deploy to moonbase as they are. Each one is short enough to read in a few minutes, and each has a one-line prompt you paste into your AI agent to put it online.

| Example | What it shows | Kind |
|---|---|---|
| [`static-landing`](static-landing/) | A landing page with images. No build step. | Static |
| [`express-guestbook`](express-guestbook/) | A Node/Express app that saves entries in a moonbase managed PostgreSQL database. | Node server + database |
| [`nextjs-minimal`](nextjs-minimal/) | A minimal Next.js app with a server-rendered page. | Next.js |

## Before you start

1. **A moonbase account.** [Sign up](https://app.moonbase.cloud/register?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch) and verify your email.
2. **The moonbase connector in your AI tool.** Add a connector with this address and sign in when the tool opens the moonbase window:

   ```text
   https://app.moonbase.cloud/mcp
   ```

   Setup steps for Claude, ChatGPT, Cursor and other tools are in [Deploy from any AI chat](https://moonbase.cloud/docs/deploy-from-ai-chat?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch). No API key is involved on this path.
3. **The example's files where your agent can read them.** Clone this repository and open it in your agent (Claude Code, Cursor), or attach the example's folder to the chat.

## Deploy with your AI agent

Paste the prompt from the example's own README. For instance, for the landing page:

```text
Deploy the static-landing folder to moonbase and give me the live link.
```

Your AI tool shows each action before it runs and asks for your OK before a deploy, unless you told it to always allow that. When the deploy finishes you get a live HTTPS address.

There is no deploy button here on purpose: a moonbase deploy goes through your agent, through an upload on moonbase itself, or through the API.

## Other ways to deploy

- **By hand.** ZIP the example's folder (leave out `node_modules` and build output) and upload it from **+ New mission** in moonbase. See [Getting Started](https://moonbase.cloud/docs/getting-started?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).
- **From CI.** See [Deploying from GitHub Actions](https://moonbase.cloud/docs/github-actions-ci-cd?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).

## What to know

- A deployed project is called a **mission**.
- An app must listen on the `PORT` environment variable. The two server examples do.
- The container's own disk does not keep data between deploys. The guestbook keeps its data in a database for that reason.
- A managed PostgreSQL database is optional: up to one per mission, where it is enabled for the account. A project asks for one with a `moonbase.json` file, as the guestbook does.
- Plans and limits: [Pricing](https://moonbase.cloud/pricing?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).

## License

MIT. See [LICENSE](LICENSE).
