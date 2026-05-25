import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  if (!access) {
    return NextResponse.json({ status: 401, status_text: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: 400, status_text: "Bad Request", message: "Corpo inválido." },
      { status: 400 }
    );
  }

  const res = await fetch(`${env.backendApiUrl}/chat/message/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
