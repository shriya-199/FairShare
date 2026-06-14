import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Pencil, Send, Trash2 } from "lucide-react";
import { Button } from "../../components/Button";
import { Input } from "../../components/Field";
import { Panel } from "../../components/Panel";
import { api, postJson } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import type { Expense, Group } from "../../types/domain";
import { ExpenseEditForm } from "./ExpenseEditForm";

export function ExpenseDetailPage() {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();
  const expenseQuery = useQuery({
    queryKey: ["expense", expenseId],
    queryFn: () => api<{ expense: Expense }>(`/api/expenses/${expenseId}`),
    enabled: Boolean(expenseId),
    refetchInterval: editing ? false : 5000,
    refetchIntervalInBackground: false
  });
  const groupQuery = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => api<{ group: Group }>(`/api/groups/${groupId}`),
    enabled: Boolean(groupId)
  });

  const messageMutation = useMutation({
    mutationFn: () => postJson(`/api/expenses/${expenseId}/messages`, { message }),
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["expense", expenseId] });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: () => api<void>(`/api/expenses/${expenseId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["balances", "group", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["balances", "overall"] });
      navigate(`/groups/${groupId}`);
    }
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    messageMutation.mutate();
  }

  if (expenseQuery.isLoading) return <p>Loading expense...</p>;
  if (expenseQuery.error || !expenseQuery.data) return <p className="text-red-700">Unable to load expense.</p>;

  const expense = expenseQuery.data.expense;

  return (
    <div className="grid gap-6">
      <Link to={`/groups/${groupId}`} className="text-sm font-semibold text-mint">
        Back to group
      </Link>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink">{expense.description}</h1>
            <p className="text-sm text-slate-600">
              {formatMoney(expense.amountCents)} paid by {expense.paidBy.name} on {formatDate(expense.expenseDate)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing((value) => !value)}>
              <Pencil size={16} /> {editing ? "Close edit" : "Edit"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-red-700 hover:bg-red-50"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 size={16} /> Delete
            </Button>
          </div>
        </div>
        {deleteMutation.error && <p className="mt-2 text-sm text-red-700">{deleteMutation.error.message}</p>}
      </div>

      {editing && groupQuery.data && (
        <Panel title="Edit expense">
          <ExpenseEditForm expense={expense} group={groupQuery.data.group} onSaved={() => setEditing(false)} />
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Splits">
          <div className="grid gap-2">
            {expense.splits.map((split) => (
              <div key={split.id} className="flex justify-between rounded-md bg-slate-50 p-3 text-sm">
                <span>{split.user.name}</span>
                <span className="font-semibold">{formatMoney(split.owedCents)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Expense chat">
          <p className="mb-3 text-xs text-slate-500">
            Updates automatically while this expense is open.
          </p>
          <div className="mb-4 grid max-h-80 gap-3 overflow-auto">
            {expense.messages?.length ? (
              expense.messages.map((item) => (
                <div key={item.id} className="rounded-md bg-slate-50 p-3">
                  <div className="mb-1 flex justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{item.author.name}</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <p className="text-sm">{item.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No messages yet.</p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message" required />
            <Button type="submit" disabled={messageMutation.isPending}>
              <Send size={16} /> Send
            </Button>
            {messageMutation.error && <p className="text-sm text-red-700 sm:col-span-2">{messageMutation.error.message}</p>}
          </form>
        </Panel>
      </div>
    </div>
  );
}
