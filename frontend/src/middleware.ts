import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/categorias",
  "/lancamentos",
  "/orcamento",
  "/perfil",
  "/analises",
];

const PUBLIC_AUTH_PATHS = ["/login", "/register"];

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://localhost:8000/api/v1";
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    );
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

async function tryRefresh(
  refreshToken: string
): Promise<{ access: string; refresh?: string } | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.access ? data : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isPublicAuth = PUBLIC_AUTH_PATHS.includes(pathname);

  if (isProtected) {
    const tokenMissing = !accessToken;
    const tokenExpired = accessToken ? isTokenExpired(accessToken) : false;

    if ((tokenMissing || tokenExpired) && refreshToken) {
      const tokens = await tryRefresh(refreshToken);
      if (tokens) {
        const response = NextResponse.next();
        const opts = {
          httpOnly: true,
          path: "/",
          sameSite: "lax" as const,
          secure: COOKIE_SECURE,
        };
        response.cookies.set("access_token", tokens.access, opts);
        if (tokens.refresh) {
          response.cookies.set("refresh_token", tokens.refresh, opts);
        }
        return response;
      }
      // refresh failed → redirect to login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    if (tokenMissing) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }
  }

  if (isPublicAuth && accessToken && !isTokenExpired(accessToken)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|css|js|images).*)",
  ],
};
