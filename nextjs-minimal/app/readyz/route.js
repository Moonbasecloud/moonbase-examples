// moonbase asks /readyz after a deploy to learn whether the app is really
// serving: 200 after one successful SELECT 1, 503 while the database cannot be
// reached.
import { getPool } from "../../db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getPool().query("SELECT 1");
    return Response.json({ ready: true });
  } catch (err) {
    console.error("readiness check failed:", err.message);
    return Response.json({ ready: false }, { status: 503 });
  }
}
