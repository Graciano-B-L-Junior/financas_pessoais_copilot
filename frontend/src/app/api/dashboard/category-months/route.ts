import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params: Record<string, string | undefined> = {
    category_id: searchParams.get("category_id") || undefined,
  };

  const response = await api.dashboard.categoryMonths(params);

  if (response.status !== 200) {
    return NextResponse.json(
      { error: "Nao foi possivel obter os meses disponíveis." },
      { status: response.status }
    );
  }

  return NextResponse.json(response.data, { status: 200 });
}
