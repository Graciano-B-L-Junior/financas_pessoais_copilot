import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { clearAuthCookies } from "@/lib/session";
import { normalizeItem } from "@/lib/normalizers";
import { NavApp } from "@/components/layout/NavApp";
import { Footer } from "@/components/layout/Footer";
import type { User } from "@/types";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const response = await api.profile.get();

  if ([401, 403].includes(response.status)) {
    await clearAuthCookies();
    redirect("/login");
  }

  if (response.status >= 500 || !response.data) {
    redirect("/login");
  }

  const currentUser = normalizeItem<User>(response.data);

  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || "/";

  return (
    <body className="page--app">
      <NavApp currentUser={currentUser} currentPath={currentPath} />
      {children}
      <Footer />
    </body>
  );
}
