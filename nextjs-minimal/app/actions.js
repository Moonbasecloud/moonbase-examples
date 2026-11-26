"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getPool } from "../db";
import { takeSlot } from "../rate-limit";

const MAX_BODY = 200;

export async function addNote(_previous, formData) {
  const raw = formData.get("body");
  const body = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  if (body.length < 1 || body.length > MAX_BODY) {
    return { error: `Write a note of 1 to ${MAX_BODY} characters.` };
  }

  const address = (await headers()).get("x-real-ip")?.trim() || "unknown";
  const wait = takeSlot(address);
  if (wait > 0) {
    return { error: `Too many notes from your address. Try again in ${wait} seconds.` };
  }

  try {
    // The value is bound as a parameter, never joined into the SQL text.
    await getPool().query("INSERT INTO notes (body) VALUES ($1)", [body]);
  } catch (err) {
    console.error("insert failed:", err.message);
    return { error: "The note could not be saved. Try again in a moment." };
  }
  revalidatePath("/");
  return { error: null, saved: true };
}
