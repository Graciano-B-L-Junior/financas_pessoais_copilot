import { Footer } from "@/components/layout/Footer";
import { NavPublic } from "@/components/layout/NavPublic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <body className="page--public">
      <NavPublic isAuthenticated={false} />
      {children}
      <Footer />
    </body>
  );
}
