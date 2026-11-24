// moonbase asks /readyz after a deploy to learn whether the app is serving.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ready: true });
}
