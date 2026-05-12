import type { Metadata } from "next";
import { consumeFlash } from "@/lib/session";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const flash = await consumeFlash();

  return <LoginForm nextPath={next || "/dashboard"} flash={flash} />;
}
