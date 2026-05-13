"use server";

import { cookies } from "next/headers";

export async function clearFlashAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("flash_type");
  cookieStore.delete("flash_message");
}