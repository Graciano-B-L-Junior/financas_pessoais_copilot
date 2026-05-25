import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  if (!access) {
    return NextResponse.json({ status: 401, status_text: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${env.backendApiUrl}/chat/history/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  if (!access) {
    return NextResponse.json({ status: 401, status_text: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${env.backendApiUrl}/chat/history/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  return new NextResponse(null, { status: res.status });
}
