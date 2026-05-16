import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { normalizeItem } from "@/lib/normalizers";
import { NavApp } from "@/components/layout/NavApp";
import { ChartBootstrap } from "@/components/layout/ChartBootstrap";
import { Footer } from "@/components/layout/Footer";
import type { User } from "@/types";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const response = await api.profile.get();

  if ([401, 403].includes(response.status)) {
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
      <div className="app-layout">
        <NavApp currentUser={currentUser} currentPath={currentPath} />
        <div className="app-content">
          {children}
          <Footer />
        </div>
      </div>
      <ChartBootstrap />
    </body>
  );
}
