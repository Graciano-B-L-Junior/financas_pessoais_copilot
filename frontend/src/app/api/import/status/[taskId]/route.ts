import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  if (!access) {
    return NextResponse.json({ status: 401, status_text: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    `${env.backendApiUrl}/transactions/import/status/${taskId}/`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
