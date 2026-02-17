"use server";

import { revalidatePath } from "next/cache";
import { eventApi } from "@/lib/api-client";

export async function createEventAction(formData: FormData) {
  const type = String(formData.get("type") ?? "").trim();
  const payloadRaw = String(formData.get("payload") ?? "").trim();

  if (!type || !payloadRaw) {
    throw new Error("Type and payload are required.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    throw new Error("Payload must be valid JSON.");
  }

  await eventApi.createEvent({ type, payload });
  revalidatePath("/events");
}
