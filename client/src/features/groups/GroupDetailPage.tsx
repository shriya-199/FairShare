import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { MessageSquare, X } from "lucide-react";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { api } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import type { Balance, Group } from "../../types/domain";
import { BalanceSummary } from "../balances/BalanceSummary";
import { ExpenseForm } from "../expenses/ExpenseForm";
import { SettlementForm } from "../settlements/SettlementForm";
import { AddMemberForm } from "./AddMemberForm";

export function GroupDetailPage() {
  const { groupId } = useParams();
  const queryClient = useQueryClient();
  const groupQuery = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => api<{ group: Group }>(`/api/groups/${groupId}`),
    enabled: Boolean(groupId)
  });
  const balanceQuery = useQuery({
    queryKey: ["balances", "group", groupId],
    queryFn: () => api<{ balance: Balance }>(`/api/balances/groups/${groupId}`),
    enabled: Boolean(groupId)
  });
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => api<void>(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      await queryClient.invalidateQueries({ queryKey: ["balances", "group", groupId] });
      await queryClient.invalidateQueries({ queryKey: ["balances", "overall"] });
    }
  });

  if (groupQuery.isLoading) return <p>Loading group...</p>;
  if (groupQuery.error || !groupQuery.data) return <p className="text-red-700">Unable to load group.</p>;

  const group = groupQuery.data.group;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{group.name}</h1>
        {group.description && <p className="text-sm text-slate-600">{group.description}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Members">
          <div className="mb-4 grid gap-2">
            {group.members.map((member) => (
              <div
                key={member.user.id}
                className="flex items-center justify-between gap-3 rounded-md bg-slate-100 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{member.user.name}</p>
                  <p className="text-xs text-slate-500">{member.user.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-8 px-2"
                  aria-label={`Remove ${member.user.name}`}
                  disabled={removeMemberMutation.isPending || group.members.length <= 1}
                  onClick={() => removeMemberMutation.mutate(member.user.id)}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
          <AddMemberForm groupId={group.id} />
          {removeMemberMutation.error && <p className="mt-2 text-sm text-red-700">{removeMemberMutation.error.message}</p>}
        </Panel>

        <Panel title="Group balances">
          <BalanceSummary balance={balanceQuery.data?.balance} />
        </Panel>
      </div>

      <Panel title="Add expense">
        <ExpenseForm group={group} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Expenses">
          <div className="grid gap-3">
            {group.expenses?.length ? (
              group.expenses.map((expense) => (
                <Link
                  to={`/groups/${group.id}/expenses/${expense.id}`}
                  key={expense.id}
                  className="rounded-md border border-slate-200 p-3 transition hover:border-mint"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{expense.description}</p>
                      <p className="text-sm text-slate-600">
                        Paid by {expense.paidBy.name} on {formatDate(expense.expenseDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatMoney(expense.amountCents)}</p>
                      <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <MessageSquare size={13} /> Chat
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-600">No expenses yet.</p>
            )}
          </div>
        </Panel>

        <Panel title="Settlements">
          <SettlementForm group={group} />
          <div className="mt-4 grid gap-2">
            {group.settlements?.length ? (
              group.settlements.map((settlement) => (
                <div key={settlement.id} className="rounded-md bg-slate-50 p-3 text-sm">
                  <div>
                    <span className="font-semibold">{settlement.fromUser.name}</span> paid{" "}
                    <span className="font-semibold">{settlement.toUser.name}</span>{" "}
                    <span className="font-semibold text-mint">{formatMoney(settlement.amountCents)}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatDate(settlement.settledAt)}
                    {settlement.note ? ` · ${settlement.note}` : ""}
                  </div>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-slate-600">No settlements recorded yet.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
