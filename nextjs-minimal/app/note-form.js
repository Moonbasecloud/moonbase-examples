"use client";

import { useActionState } from "react";
import { addNote } from "./actions";

export default function NoteForm() {
  const [state, formAction, pending] = useActionState(addNote, { error: null });
  return (
    <form action={formAction} className="card">
      <label htmlFor="body">New note</label>
      <textarea id="body" name="body" maxLength={200} rows={3} required />
      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save note"}
      </button>
      <p role="status" className={state.error ? "error" : "ok"}>
        {state.error || (state.saved ? "Saved." : "")}
      </p>
    </form>
  );
}
