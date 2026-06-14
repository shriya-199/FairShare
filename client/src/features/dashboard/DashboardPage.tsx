import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, FileWarning, Plus, Sparkles } from "lucide-react";
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
      <section className="glass-panel overflow-hidden rounded-lg p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-elevated/70 px-3 py-1 text-xs font-semibold text-muted">
              <Sparkles size={14} /> Import, explain, settle
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-ink md:text-5xl">
              Shared expenses that are easy to audit in a live interview.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Upload messy flatmate CSVs, surface anomalies, and explain every rupee from raw row to final settlement.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link to="/imports">
              <Button className="w-full justify-between">
                <span className="inline-flex items-center gap-2"><FileWarning size={16} /> Review CSV import</span>
                <ArrowUpRight size={16} />
              </Button>
            </Link>
            <Link to="/groups/new">
              <Button variant="secondary" className="w-full justify-between">
                <span className="inline-flex items-center gap-2"><Plus size={16} /> Create demo group</span>
                <ArrowUpRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Your net balance</p>
          <p className={`mt-2 text-3xl font-bold ${myNet >= 0 ? "text-mint" : "text-coral"}`}>
            {formatMoney(myNet)}
          </p>
          <p className="mt-2 text-xs text-muted">Across every group you can access.</p>
        </Panel>
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Groups</p>
          <p className="mt-2 text-3xl font-bold text-ink">{groupsQuery.data?.groups.length || 0}</p>
          <p className="mt-2 text-xs text-muted">Household, trips, and demo scenarios.</p>
        </Panel>
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Open balances</p>
          <p className="mt-2 text-3xl font-bold text-ink">{balanceQuery.data?.balance.pairwise.length || 0}</p>
          <p className="mt-2 text-xs text-muted">Simplified who-pays-whom rows.</p>
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
                  className="group rounded-md border border-line bg-elevated/50 p-4 transition hover:-translate-y-0.5 hover:border-mint hover:bg-surface"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ink">{group.name}</div>
                      <div className="text-sm text-muted">{group.members.length} members</div>
                    </div>
                    <ArrowUpRight className="text-muted transition group-hover:text-mint" size={16} />
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted">Create a group to start tracking shared expenses.</p>
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
