import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { api } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import type { SettlementRecommendation } from "../../types/domain";

export function SettlementRecommendationsPage() {
  const { groupId } = useParams();
  const recommendationsQuery = useQuery({
    queryKey: ["balances", "recommendations", groupId],
    queryFn: () => api<{ recommendations: SettlementRecommendation[] }>(`/api/balances/groups/${groupId}/recommendations`),
    enabled: Boolean(groupId)
  });

  if (recommendationsQuery.isLoading) return <p>Loading settlement recommendations...</p>;
  if (recommendationsQuery.error || !recommendationsQuery.data) {
    return <p className="text-coral">Unable to load settlement recommendations.</p>;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Simplified settlement recommendations</h1>
          <p className="text-sm text-muted">These recommendations use normalized INR balances after expenses and settlements.</p>
        </div>
        <Link to={`/groups/${groupId}`}>
          <Button type="button" variant="secondary">Back to group</Button>
        </Link>
      </div>

      <Panel title="Who pays whom">
        <div className="grid gap-3">
          {recommendationsQuery.data.recommendations.length ? (
            recommendationsQuery.data.recommendations.map((item) => (
              <div key={`${item.fromUser.id}-${item.toUser.id}`} className="rounded-md border border-line bg-elevated/50 p-3">
                <p className="text-sm">
                  <span className="font-semibold">{item.fromUser.name}</span> pays{" "}
                  <span className="font-semibold">{item.toUser.name}</span>{" "}
                  <span className="font-semibold text-coral">{formatMoney(item.amountCents)}</span>
                </p>
                <p className="mt-1 text-xs text-muted">{item.explanation}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No settlement recommendations. The group is balanced.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
