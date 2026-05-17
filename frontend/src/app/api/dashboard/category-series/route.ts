import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params: Record<string, string | undefined> = {
    category_id: searchParams.get("category_id") || undefined,
    granularity: searchParams.get("granularity") || undefined,
    start: searchParams.get("start") || undefined,
    end: searchParams.get("end") || undefined,
    month: searchParams.get("month") || undefined,
  };

  const response = await api.dashboard.categorySeries(params);

  if (response.status !== 200) {
    return NextResponse.json(
      { error: "Não foi possível obter os dados." },
      { status: response.status }
    );
  }

  return NextResponse.json(response.data, { status: 200 });
}
