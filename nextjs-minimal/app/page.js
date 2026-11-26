// Rendered on the server for each request: the notes below are read from the
// moonbase managed PostgreSQL database every time the page loads.
import { getPool } from "../db";
import NoteForm from "./note-form";

export const dynamic = "force-dynamic";

const MOONBASE_URL = "https://moonbase.cloud/?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch";
const PAGE_SIZE = 20;

async function loadNotes() {
  try {
    const { rows } = await getPool().query(
      "SELECT id, body, created_at FROM notes ORDER BY created_at DESC, id DESC LIMIT $1",
      [PAGE_SIZE],
    );
    return { notes: rows, error: null };
  } catch (err) {
    console.error("list failed:", err.message);
    return {
      notes: [],
      error:
        err.code === "DATABASE_SETTINGS_MISSING"
          ? "This app has no database settings. On moonbase they are set for you when moonbase.json declares a database."
          : "The notes are not available right now.",
    };
  }
}

export default async function Home() {
  const { notes, error } = await loadNotes();
  return (
    <main>
      <h1>Notes on moonbase</h1>
      <p>A small Next.js app. Each note is saved in a moonbase managed PostgreSQL database.</p>
      <NoteForm />
      {error ? <p className="error">{error}</p> : null}
      {!error && notes.length === 0 ? <p>No notes yet. Write the first one.</p> : null}
      <ul className="notes">
        {notes.map((note) => (
          <li key={note.id} className="card">
            <p>{note.body}</p>
            <time dateTime={new Date(note.created_at).toISOString()}>
              {new Date(note.created_at).toISOString().replace("T", " ").slice(0, 16)} UTC
            </time>
          </li>
        ))}
      </ul>
      <p>
        An example app hosted on <a href={MOONBASE_URL}>moonbase</a>.
      </p>
    </main>
  );
}
