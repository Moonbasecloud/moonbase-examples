# Minimal Next.js app

One server-rendered page and one readiness route, built with the Next.js App Router. moonbase detects Next.js, installs the dependencies, builds the app and runs it.

```text
nextjs-minimal/
  app/layout.js        the page shell
  app/page.js          the home page, rendered on the server for each request
  app/readyz/route.js  answers moonbase's readiness check
  next.config.mjs
  package.json
```

Two things in `package.json` matter for hosting:

- `"start": "next start -p ${PORT:-3000}"`: the app listens on the `PORT` moonbase sets, and on 3000 when you run it yourself.
- `"build": "next build"`: moonbase builds fresh, so `.next/` and `node_modules/` are not uploaded.

## Deploy with your AI agent

With the moonbase connector connected (see the [repository README](../README.md#before-you-start)), open this repository in your agent and paste:

```text
Deploy the nextjs-minimal folder to moonbase and give me the live link.
```

## Run it locally

Needs Node.js 20.9 or newer.

```bash
cd nextjs-minimal
npm install
npm run build
npm start
```

Then open `http://localhost:3000`. Reload the page and the time on it changes: the page is rendered by the running server. For development with live reload, use `npm run dev`.

## Good to know

- Values in `NEXT_PUBLIC_*` variables reach the browser. Never put a secret in one.
- On the free plan a server app sleeps after a while with no visitors and wakes on the next request, so the first load after a quiet period is slower.

More: [Getting Started](https://moonbase.cloud/docs/getting-started?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch) and [Mission Sleep & Wake](https://moonbase.cloud/docs/sleeping-sites?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).
