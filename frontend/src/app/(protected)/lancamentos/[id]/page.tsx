import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { api } from "@/lib/api";
import { normalizeItem, normalizeList } from "@/lib/normalizers";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { updateTransactionAction } from "@/app/actions/transactions";
import type { Category, Transaction } from "@/types";

export const metadata: Metadata = { title: "Editar lancamento" };

export default async function TransactionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [transactionRes, categoriesRes] = await Promise.all([
    api.transactions.retrieve(id),
    api.categories.list({ is_active: "true" }),
  ]);

  if ([401, 403].includes(transactionRes.status)) redirect("/login");
  if (transactionRes.status === 404) notFound();

  const transaction = normalizeItem<Transaction>(transactionRes.data);
  const categories = normalizeList<Category>(categoriesRes.data).map((c) => ({
    ...c,
    label: c.name,
  }));
  const action = updateTransactionAction.bind(null, id);

  return (
    <main className="container page-shell">
      <TransactionForm
        categories={categories}
        transaction={transaction}
        action={action}
      />
    </main>
  );
}
