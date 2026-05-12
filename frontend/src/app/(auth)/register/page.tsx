import type { Metadata } from "next";
import { consumeFlash } from "@/lib/session";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = { title: "Criar conta" };

export default async function RegisterPage() {
  const flash = await consumeFlash();
  return <RegisterForm flash={flash} />;
}
