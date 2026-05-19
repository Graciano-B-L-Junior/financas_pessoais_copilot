import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const year = searchParams.get("year");

  if (!year) {
    return new NextResponse("Parâmetro 'year' não informado.", { status: 400 });
  }

  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  const url = `${env.backendApiUrl}/transactions/export/?year=${year}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return new NextResponse("Erro ao exportar a planilha.", { status: res.status });
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
      `attachment; filename="gastos_${year}.xlsx"`
  );

  return new NextResponse(blob, { status: 200, headers });
}
