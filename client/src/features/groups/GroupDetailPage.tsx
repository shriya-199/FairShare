import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, MessageSquare, X } from "lucide-react";
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
  if (groupQuery.error || !groupQuery.data) return <p className="text-coral">Unable to load group.</p>;

  const group = groupQuery.data.group;

  return (
    <div className="grid gap-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Group workspace</p>
            <h1 className="text-4xl font-bold tracking-tight text-ink">{group.name}</h1>
            {group.description && <p className="mt-2 text-sm text-muted">{group.description}</p>}
          </div>
          <Link to={`/groups/${group.id}/recommendations`}>
            <Button variant="secondary">
              Recommendations <ArrowUpRight size={16} />
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Members">
          <div className="mb-4 grid gap-2">
            {group.members.map((member) => (
              <div
                key={member.user.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line bg-elevated/60 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{member.user.name}</p>
                  <p className="text-xs text-muted">{member.user.email}</p>
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
          {removeMemberMutation.error && <p className="mt-2 text-sm text-coral">{removeMemberMutation.error.message}</p>}
        </Panel>

        <Panel title="Group balances">
          <BalanceSummary balance={balanceQuery.data?.balance} />
          <div className="mt-4 flex flex-wrap gap-2">
            {group.members.map((member) => (
              <Link key={member.user.id} to={`/groups/${group.id}/balances/${member.user.id}`}>
                <Button type="button" variant="secondary" className="min-h-9 px-3">
                  Explain {member.user.name}
                </Button>
              </Link>
            ))}
            <Link to={`/groups/${group.id}/recommendations`}>
              <Button type="button" variant="secondary" className="min-h-9 px-3">
                Settlement recommendations
              </Button>
            </Link>
          </div>
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
                  className="group rounded-md border border-line bg-elevated/50 p-4 transition hover:-translate-y-0.5 hover:border-mint hover:bg-surface"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{expense.description}</p>
                      <p className="text-sm text-muted">
                        Paid by {expense.paidBy.name} on {formatDate(expense.expenseDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatMoney(expense.amountCents)}</p>
                      <p className="inline-flex items-center gap-1 text-xs text-muted">
                        <MessageSquare size={13} /> Chat
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted">No expenses yet.</p>
            )}
          </div>
        </Panel>

        <Panel title="Settlements">
          <SettlementForm group={group} />
          <div className="mt-4 grid gap-2">
            {group.settlements?.length ? (
              group.settlements.map((settlement) => (
                <div key={settlement.id} className="rounded-md border border-line bg-elevated/60 p-3 text-sm">
                  <div>
                    <span className="font-semibold">{settlement.fromUser.name}</span> paid{" "}
                    <span className="font-semibold">{settlement.toUser.name}</span>{" "}
                    <span className="font-semibold text-mint">{formatMoney(settlement.amountCents)}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {formatDate(settlement.settledAt)}
                    {settlement.note ? ` · ${settlement.note}` : ""}
                  </div>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-muted">No settlements recorded yet.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
