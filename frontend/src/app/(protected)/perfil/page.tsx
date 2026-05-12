import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { consumeFlash } from "@/lib/session";
import { normalizeItem } from "@/lib/normalizers";
import { getInitials } from "@/lib/formatters";
import { Flash } from "@/components/ui/Flash";
import { ProfileForm } from "@/components/forms/ProfileForm";
import type { User } from "@/types";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const response = await api.profile.get();
  if ([401, 403].includes(response.status)) redirect("/login");

  const flash = await consumeFlash();
  const user = normalizeItem<User>(response.data);

  return (
    <main className="container page-shell shell-grid">
      <section className="surface panel">
        <div className="page-heading">
          <span className="eyebrow">Perfil</span>
          <h1>Configuracoes da conta</h1>
          <p>
            Atualize seus dados pessoais e gerencie sua senha.
          </p>
        </div>

        <Flash flash={flash} />

        <div className="avatar-block">
          <div className="avatar avatar--lg">{getInitials(user)}</div>
          <div>
            <strong>
              {user.first_name} {user.last_name}
            </strong>
            <br />
            <span className="muted">{user.email}</span>
          </div>
        </div>
      </section>

      <ProfileForm user={user} />
    </main>
  );
}
