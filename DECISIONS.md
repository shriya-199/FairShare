# Decisions

## Decision Log

### 2026-06-14 - Assignment Pivot Accepted
- Decision: Stop treating the app as a generic Splitwise clone.
- Reason: User provided updated assignment with flatmates, dated memberships, exact CSV import, anomaly detection, and new deliverables.
- Impact: CSV import, anomaly detection, date-aware memberships, currency handling, and explainable balances become top priority.

### 2026-06-14 - Preserve Existing Working Code
- Decision: Do not delete existing authentication, group, expense, settlement, and balance code unless necessary.
- Reason: The pivot still needs login, groups, expenses, balances, settlements, and relational DB usage.
- Impact: Existing code becomes the foundation, but it must be adapted for CSV import and membership periods.

### 2026-06-14 - Relational Database Remains PostgreSQL + Prisma
- Decision: Keep PostgreSQL and Prisma.
- Reason: New assignment explicitly requires relational DB only, and the existing stack already satisfies this.
- Impact: Add import/anomaly/membership-period tables through Prisma migrations instead of introducing non-relational storage.

### 2026-06-14 - CSV Must Be Imported As Provided
- Decision: The importer must parse the uploaded/provided `expenses_export.csv` without manual file edits.
- Reason: Assignment explicitly forbids manual CSV editing.
- Impact: The app must store raw rows, detect anomalies, and quarantine invalid rows rather than fixing the source file.

### 2026-06-14 - Missing CSV Is A Blocker
- Decision: Exact importer implementation cannot be finalized until `expenses_export.csv` is present.
- Reason: Column names, split types, currencies, and deliberate anomalies are unknown.
- Impact: Documentation now records this blocker; implementation should start with importer architecture, but final mapping and anomaly log require the file.

### 2026-06-14 - Anomalies Must Be First-Class Records
- Decision: Store anomalies in relational tables and surface them in UI/report.
- Reason: The assignment requires every anomaly to be detected, surfaced, documented, and included in an import report.
- Impact: Add `CsvImportBatch`, `CsvRawRow`, anomaly, decision, and report concepts to schema.

### 2026-06-14 - No Silent Guessing
- Decision: Any ambiguous or invalid CSV value must be flagged with a policy instead of guessed silently.
- Reason: Explicit assignment requirement.
- Impact: Importer must prefer quarantine/review over hidden correction.

### 2026-06-14 - Currency Handling Stores Original And Normalized INR
- Decision: Store original currency/minor amount and normalized INR cents separately on expenses and settlements.
- Reason: Priya's requirement is to correct currency mistakes such as USD being treated as INR without losing original evidence.
- Impact: `Expense`, `ExpenseSplit`, and `Settlement` preserve original currency data while balance math uses normalized INR amounts.

### 2026-06-14 - Membership Date Ranges Are Required
- Decision: Replace simple current-only membership assumptions with date-aware membership.
- Reason: Meera moved out, Sam moved in, and Dev joined for a trip.
- Impact: Expense import validation must check payer/participants against date ranges and trip membership context.

### 2026-06-14 - Upload Implementation Uses Browser File Read + JSON POST
- Decision: The UI accepts a CSV file input, reads the file text in the browser, and posts the exact text to the backend.
- Alternatives considered: multipart upload with `multer` or another upload dependency.
- Reason: Avoids new upload dependencies, keeps deployment simple, and still preserves the uploaded CSV text exactly.
- Impact: Backend receives `fileName` and `csvText`, stores `originalCsv`, parses rows, and records raw row data.

### 2026-06-14 - Generic Column Alias Mapping Until CSV Is Provided
- Decision: Importer supports common aliases such as `date`, `description`, `amount`, `payer`, `participants`, `split type`, `splits`, `currency`, `notes`, and `category`.
- Alternatives considered: hard-coding exact CSV columns.
- Reason: `expenses_export.csv` is not present in the workspace.
- Impact: The importer is functional but exact mapping must be verified against the real CSV once provided.

### 2026-06-14 - Error Anomalies Block Import Unless User Acts
- Decision: Rows with unresolved error anomalies are marked `BLOCKED` on finalize.
- Alternatives considered: skip all error rows automatically or import with best-effort guesses.
- Reason: Assignment explicitly says do not crash and do not silently guess.
- Impact: User must choose `APPROVE_IMPORT`, `IGNORE_ROW`, `FIXED_EXTERNALLY`, or `NEEDS_REVIEW` for error anomalies.

### 2026-06-14 - Needs Review Does Not Import A Row
- Decision: `NEEDS_REVIEW` keeps an error row blocked during finalize.
- Alternatives considered: treating any selected action as enough to import.
- Reason: A review marker is not an approval or correction, so importing would silently bypass the unresolved issue.
- Impact: Users can mark a row for review without losing the row or accidentally importing it.

### 2026-06-14 - Warnings Surface But Do Not Block By Default
- Decision: Warning anomalies like blank notes/category or mixed date formats are shown in preview but do not block import.
- Alternatives considered: blocking every anomaly.
- Reason: The assignment distinguishes anomaly surfacing from mandatory rejection; warnings preserve progress while still documenting risk.
- Impact: Import report includes warnings even for imported rows.

### 2026-06-14 - Non-INR Currency Requires Approval
- Decision: Non-INR rows are flagged as `CURRENCY_MISMATCH` error.
- Alternatives considered: convert currencies or treat all currencies as INR.
- Reason: Assignment specifically calls out USD treated like INR as a problem, and no conversion rates were provided.
- Impact: Importer stores currency code but blocks non-INR rows until reviewed.

### 2026-06-14 - Import Report Stored As JSON
- Decision: Finalize stores report summary on `CsvImportBatch.report`.
- Alternatives considered: generating only a downloadable text file.
- Reason: Relational DB persistence makes report reproducible and displayable in UI.
- Impact: Report includes total rows, imported rows, skipped rows, blocked rows, anomaly count, and generation timestamp.

### 2026-06-14 - Assignment Schema Names Are Used
- Decision: Rename pivot-facing models to `GroupMembership`, `CsvImportBatch`, and `CsvRawRow`.
- Alternatives considered: keeping older names `GroupMember`, `ImportBatch`, and `ImportRawRow`.
- Reason: The assignment explicitly asks for those models/tables, and the schema should be directly explainable to an evaluator.
- Impact: Prisma delegates and migrations now use the assignment vocabulary while frontend response fields still expose `group.members` for UI compatibility.

### 2026-06-14 - Import Decisions Are Append-Only Records
- Decision: Add `ImportDecision` records when users choose anomaly actions.
- Alternatives considered: only updating `ImportAnomaly.finalActionTaken`.
- Reason: Suspicious rows must never be silently modified or deleted; reviewer choices need their own audit trail.
- Impact: The anomaly still carries the latest action for easy UI display, and `ImportDecision` preserves decision history.

### 2026-06-14 - Exchange Rates Are Stored, Not Implied
- Decision: Add `CurrencyRate` with rate stored in micros.
- Alternatives considered: storing floating-point rates directly on expenses or converting without a rate table.
- Reason: Currency correction must be reproducible and integer-based.
- Impact: Imported non-INR rows can later link to an explicit exchange-rate record; current importer flags them until reviewed.

### 2026-06-14 - Balance Explanation Is User-Specific
- Decision: Add a balance explanation route and screen for a selected user.
- Alternatives considered: only showing aggregate balances.
- Reason: Rohan must be able to trace exactly which expenses create his balance.
- Impact: `/groups/:groupId/balances/:userId` shows expense and settlement lines with raw CSV row details when available.

### 2026-06-14 - Settlement Recommendations Reuse Pairwise Normalization
- Decision: Use current pairwise normalized balances as simplified settlement recommendations.
- Alternatives considered: implementing multi-party debt minimization.
- Reason: Aisha needs a clear "who pays whom" summary, and pairwise normalization is explainable within the 3-day scope.
- Impact: `/groups/:groupId/recommendations` shows payer, receiver, and normalized INR amount.

## Reuse Decisions
- Reuse auth module.
- Reuse PostgreSQL/Prisma setup.
- Reuse expense/split calculation logic after import mapping.
- Reuse settlement and balance modules after adding currency and membership policies.
- Reuse dashboard/group UI patterns but shift primary UX toward import, anomaly report, and explainable balances.

## Pending Decisions
- Exact CSV column mapping.
- Exact anomaly codes after inspecting `expenses_export.csv`.
- Whether multiple currencies exist.
- Whether Dev belongs to a separate trip group or a temporary membership period in the flatmates group.
- Whether imported invalid rows are skipped, quarantined, or user-resolvable per anomaly category.
- Public deployment provider.
