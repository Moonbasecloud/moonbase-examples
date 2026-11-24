// Rendered on the server for each request, so the time below changes on
// reload. That is the proof this is a running Next.js server, not a static file.
export const dynamic = "force-dynamic";

const MOONBASE_URL = "https://moonbase.cloud/?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch";

export default function Home() {
  const renderedAt = new Date().toISOString();
  return (
    <main>
      <h1>Next.js on moonbase</h1>
      <p>A minimal App Router project: one page, one readiness route, no extra configuration.</p>
      <div className="card">
        <p>
          <strong>Rendered on the server at:</strong> <code>{renderedAt}</code>
        </p>
        <p>
          Readiness route: <a href="/readyz"><code>/readyz</code></a>
        </p>
      </div>
      <p>
        An example app hosted on <a href={MOONBASE_URL}>moonbase</a>.
      </p>
    </main>
  );
}
