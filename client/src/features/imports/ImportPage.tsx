import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileUp, ShieldCheck } from "lucide-react";
import { Button } from "../../components/Button";
import { Field, Select } from "../../components/Field";
import { Panel } from "../../components/Panel";
import { api, postJson } from "../../lib/api";
import type { CsvImportBatch, CsvRawRow, Group } from "../../types/domain";

const actionOptions = [
  { value: "", label: "No action" },
  { value: "APPROVE_IMPORT", label: "Approve import" },
  { value: "IGNORE_ROW", label: "Ignore row" },
  { value: "FIXED_EXTERNALLY", label: "Marked fixed" },
  { value: "NEEDS_REVIEW", label: "Needs review" }
];

function severityClass(severity: string) {
  if (severity === "ERROR") return "bg-coral/10 text-coral";
  if (severity === "WARNING") return "bg-amber-500/10 text-amber-600";
  return "bg-mint/10 text-mint";
}

export function ImportPage() {
  const queryClient = useQueryClient();
  const [groupId, setGroupId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [activeImportId, setActiveImportId] = useState("");
  const groupsQuery = useQuery({ queryKey: ["groups"], queryFn: () => api<{ groups: Group[] }>("/api/groups") });
  const importQuery = useQuery({
    queryKey: ["import", activeImportId],
    queryFn: () => api<{ import: CsvImportBatch }>(`/api/imports/${activeImportId}`),
    enabled: Boolean(activeImportId)
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a CSV file first");
      const csvText = await file.text();
      return postJson<{ import: CsvImportBatch }>("/api/imports/preview", {
        groupId,
        fileName: file.name,
        csvText
      });
    },
    onSuccess: (data) => {
      setActiveImportId(data.import.id);
      queryClient.setQueryData(["import", data.import.id], data);
    }
  });

  const actionMutation = useMutation({
    mutationFn: ({ anomalyId, finalActionTaken }: { anomalyId: string; finalActionTaken: string }) =>
      api(`/api/imports/${activeImportId}/anomalies/${anomalyId}`, {
        method: "PATCH",
        body: JSON.stringify({ finalActionTaken })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["import", activeImportId] });
    }
  });

  const finalizeMutation = useMutation({
    mutationFn: () => postJson<{ import: CsvImportBatch }>(`/api/imports/${activeImportId}/finalize`, {}),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["import", activeImportId] });
      await queryClient.invalidateQueries({ queryKey: ["group", data.import.groupId] });
      await queryClient.invalidateQueries({ queryKey: ["balances", "group", data.import.groupId] });
      await queryClient.invalidateQueries({ queryKey: ["balances", "overall"] });
    }
  });

  const currentImport = importQuery.data?.import || previewMutation.data?.import || finalizeMutation.data?.import;
  const unresolvedErrors = useMemo(
    () => currentImport?.anomalies.filter((anomaly) => anomaly.severity === "ERROR" && !anomaly.finalActionTaken).length || 0,
    [currentImport]
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    previewMutation.mutate();
  }

  return (
    <div className="grid gap-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-elevated/70 px-3 py-1 text-xs font-semibold text-muted">
              <ShieldCheck size={14} /> No silent guesses
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-ink">CSV import control room</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Upload the exact export, inspect anomalies row by row, and generate a reviewable import report.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Step label="Upload" value="1" />
            <Step label="Review" value="2" />
            <Step label="Finalize" value="3" />
          </div>
        </div>
      </section>

      <Panel title="Upload CSV">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <Field label="Group">
            <Select value={groupId} onChange={(event) => setGroupId(event.target.value)} required>
              <option value="">Choose group</option>
              {groupsQuery.data?.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="CSV file">
            <input
              className="focus-ring min-h-10 rounded-md border border-line bg-surface/80 px-3 py-2 text-sm text-ink"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              required
            />
          </Field>
          <Button type="submit" disabled={previewMutation.isPending || !groupId || !file} className="self-end">
            <FileUp size={16} /> {previewMutation.isPending ? "Parsing..." : "Preview"}
          </Button>
        </form>
        {previewMutation.error && <p className="mt-3 text-sm text-coral">{previewMutation.error.message}</p>}
      </Panel>

      {currentImport && (
        <Panel title="Import preview">
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <Summary label="Rows" value={currentImport.totalRows} />
            <Summary label="Anomalies" value={currentImport.anomalies.length} />
            <Summary label="Unresolved errors" value={unresolvedErrors} />
            <Summary label="Status" value={currentImport.status} />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Error anomalies require an explicit action before affected rows can be imported.
            </p>
            <Button onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending}>
              <CheckCircle2 size={16} /> {finalizeMutation.isPending ? "Finalizing..." : "Finalize import"}
            </Button>
          </div>

          {finalizeMutation.error && <p className="mb-3 text-sm text-coral">{finalizeMutation.error.message}</p>}
          {currentImport.report && (
            <div className="mb-4 rounded-md border border-mint/30 bg-mint/10 p-3 text-sm text-mint">
              <span className="font-semibold">Import report generated:</span> {JSON.stringify(currentImport.report)}
            </div>
          )}

          <div className="grid gap-3">
            {currentImport.rows.map((row) => (
              <ImportRowCard
                key={row.id}
                row={row}
                onAction={(anomalyId, finalActionTaken) =>
                  actionMutation.mutate({ anomalyId, finalActionTaken })
                }
              />
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-line bg-elevated/60 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function Step({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-elevated/60 p-3">
      <p className="mx-auto mb-1 grid size-7 place-items-center rounded-full bg-ink text-xs font-bold text-cloud">{value}</p>
      <p className="font-semibold text-muted">{label}</p>
    </div>
  );
}

function ImportRowCard({
  row,
  onAction
}: {
  row: CsvRawRow;
  onAction: (anomalyId: string, finalActionTaken: string) => void;
}) {
  return (
    <div className="rounded-md border border-line bg-surface/70 p-3 transition hover:border-mint/60">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-ink">Row {row.rowNumber}</p>
        <span className="rounded-full bg-elevated px-3 py-1 text-xs text-muted">{row.status}</span>
      </div>
      <pre className="mb-3 max-h-52 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">
        {JSON.stringify(row.rawData, null, 2)}
      </pre>
      <div className="grid gap-2">
        {row.anomalies.length ? (
          row.anomalies.map((anomaly) => (
            <div key={anomaly.id} className="rounded-md border border-line bg-elevated/60 p-3 text-sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${severityClass(anomaly.severity)}`}>
                  {anomaly.severity}
                </span>
                <span className="font-semibold">{anomaly.anomalyType}</span>
                {anomaly.userApprovalRequired && <span className="inline-flex items-center gap-1 text-xs text-coral"><AlertTriangle size={12} /> approval required</span>}
              </div>
              <p>{anomaly.explanation}</p>
              <p className="mt-1 text-muted">{anomaly.suggestedAction}</p>
              <select
                className="focus-ring mt-2 min-h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink"
                value={anomaly.finalActionTaken || ""}
                onChange={(event) => event.target.value && onAction(anomaly.id, event.target.value)}
              >
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">No anomalies detected.</p>
        )}
      </div>
    </div>
  );
}
