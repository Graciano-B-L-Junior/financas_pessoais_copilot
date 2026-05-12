import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { api } from "@/lib/api";
import { normalizeItem } from "@/lib/normalizers";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { updateCategoryAction } from "@/app/actions/categories";
import type { Category } from "@/types";

export const metadata: Metadata = { title: "Editar categoria" };

export default async function CategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = await api.categories.retrieve(id);

  if ([401, 403].includes(response.status)) redirect("/login");
  if (response.status === 404) notFound();

  const category = normalizeItem<Category>(response.data);
  const action = updateCategoryAction.bind(null, id);

  return (
    <main className="container page-shell">
      <CategoryForm category={category} action={action} />
    </main>
  );
}
