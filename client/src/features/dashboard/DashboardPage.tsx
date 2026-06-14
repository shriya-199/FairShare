import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { api } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import type { Balance, Group } from "../../types/domain";
import { useAuth } from "../auth/AuthProvider";
import { BalanceSummary } from "../balances/BalanceSummary";

export function DashboardPage() {
  const { user } = useAuth();
  const groupsQuery = useQuery({ queryKey: ["groups"], queryFn: () => api<{ groups: Group[] }>("/api/groups") });
  const balanceQuery = useQuery({
    queryKey: ["balances", "overall"],
    queryFn: () => api<{ balance: Balance }>("/api/balances/overall")
  });

  const myNet = balanceQuery.data?.balance.netByUser.find((item) => item.id === user?.id)?.netCents || 0;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-slate-600">Overall balances across your shared groups.</p>
        </div>
        <Link to="/groups/new">
          <Button>
            <Plus size={16} /> New group
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel>
          <p className="text-sm text-slate-600">Your net balance</p>
          <p className={`mt-2 text-3xl font-bold ${myNet >= 0 ? "text-mint" : "text-coral"}`}>
            {formatMoney(myNet)}
          </p>
        </Panel>
        <Panel>
          <p className="text-sm text-slate-600">Groups</p>
          <p className="mt-2 text-3xl font-bold text-ink">{groupsQuery.data?.groups.length || 0}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-slate-600">Open pairwise balances</p>
          <p className="mt-2 text-3xl font-bold text-ink">{balanceQuery.data?.balance.pairwise.length || 0}</p>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Your groups">
          <div className="grid gap-3">
            {groupsQuery.data?.groups.length ? (
              groupsQuery.data.groups.map((group) => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="rounded-md border border-slate-200 p-3 transition hover:border-mint"
                >
                  <div className="font-semibold text-ink">{group.name}</div>
                  <div className="text-sm text-slate-600">{group.members.length} members</div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-600">Create a group to start tracking shared expenses.</p>
            )}
          </div>
        </Panel>

        <Panel title="Overall balances">
          <BalanceSummary balance={balanceQuery.data?.balance} currentUserId={user?.id} />
        </Panel>
      </div>
    </div>
  );
}
