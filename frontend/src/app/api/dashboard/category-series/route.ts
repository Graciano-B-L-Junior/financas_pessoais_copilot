import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params: Record<string, string | undefined> = {
    month: searchParams.get("month") || undefined,
    start: searchParams.get("start") || undefined,
    end: searchParams.get("end") || undefined,
  };

  const response = await api.dashboard.categorySeries(params);

  if (response.status !== 200) {
    return NextResponse.json(
      { error: "Nao foi possivel obter os dados." },
      { status: response.status }
    );
  }

  return NextResponse.json(response.data, { status: 200 });
}
