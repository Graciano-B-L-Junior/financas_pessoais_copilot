import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  const url = `${env.backendApiUrl}/transactions/template/`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return new NextResponse("Erro ao baixar template", { status: res.status });
  }

  const blob = await res.blob();
  const headers = new Headers();
  headers.set(
    "Content-Type",
    res.headers.get("Content-Type") ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  headers.set(
    "Content-Disposition",
    res.headers.get("Content-Disposition") ||
      'attachment; filename="template_gastos.xlsx"'
  );

  return new NextResponse(blob, { status: 200, headers });
}
