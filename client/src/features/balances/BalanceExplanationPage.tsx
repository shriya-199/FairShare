import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { Panel } from "../../components/Panel";
import { api } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import type { BalanceExplanation } from "../../types/domain";

export function BalanceExplanationPage() {
  const { groupId, userId } = useParams();
  const explanationQuery = useQuery({
    queryKey: ["balances", "explanation", groupId, userId],
    queryFn: () => api<{ explanation: BalanceExplanation }>(`/api/balances/groups/${groupId}/explanation/${userId}`),
    enabled: Boolean(groupId && userId)
  });

  if (explanationQuery.isLoading) return <p>Loading explanation...</p>;
  if (explanationQuery.error || !explanationQuery.data) {
    return <p className="text-coral">Unable to load balance explanation.</p>;
  }

  const explanation = explanationQuery.data.explanation;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{explanation.user.name} balance explanation</h1>
          <p className="text-sm text-muted">
            Net normalized INR balance: <span className="font-semibold">{formatMoney(explanation.netCents)}</span>
          </p>
        </div>
        <Link to={`/groups/${groupId}`}>
          <Button type="button" variant="secondary">Back to group</Button>
        </Link>
      </div>

      <Panel title="Expense-by-expense trace">
        <div className="grid gap-3">
          {explanation.lines.length ? (
            explanation.lines.map((line, index) => (
              <div key={`${line.type}-${index}`} className="rounded-md border border-line bg-elevated/50 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">
                      {line.type === "EXPENSE" ? line.description : "Settlement"}
                    </p>
                    <p className="text-xs text-muted">{formatDate(line.date)}</p>
                  </div>
                  <span className={`font-semibold ${line.deltaCents >= 0 ? "text-mint" : "text-coral"}`}>
                    {formatMoney(line.deltaCents)}
                  </span>
                </div>
                <p className="mt-2 text-muted">{line.explanation}</p>
                {line.originalCurrency !== "INR" && (
                  <p className="mt-1 text-xs text-amber-700">
                    Original currency: {line.originalCurrency}; normalized INR value is used for balances.
                  </p>
                )}
                {line.type === "EXPENSE" && line.csvRowNumber && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold text-muted">CSV row {line.csvRowNumber}</summary>
                    <pre className="mt-2 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">
                      {JSON.stringify(line.rawCsvRow, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No expenses or settlements affect this user yet.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
