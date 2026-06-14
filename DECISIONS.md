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

### 2026-06-15 - Settlement Page Prioritizes Aisha's Single Question
- Decision: Redesign `/groups/:groupId/recommendations` to show only large who-pays-whom cards with one-click settlement recording.
- Alternatives considered: keeping explanatory recommendation rows inside a panel or adding a full settlement form to each row.
- Reason: Aisha's requirement is immediate clarity, so the page should answer only "who pays whom" and make recording the payment one action.
- Impact: The page now uses minimal typography-led cards and posts recommended payments directly to `POST /api/settlements`.

### 2026-06-14 - Premium SaaS UX Without New UI Framework
- Decision: Redesign the existing React/Tailwind UI using shared CSS variables, upgraded primitives, and focused page composition.
- Alternatives considered: adding a component library or doing a large frontend rewrite.
- Reason: The submission needs to feel polished and memorable, but the assignment still values maintainability and 3-day delivery realism.
- Impact: `Button`, `Panel`, `Field`, app shell, dashboard, import, auth, group, and balance screens now share a premium light/dark visual language without extra dependencies.

### 2026-06-14 - Dashboard Becomes A Demo Command Center
- Decision: Replace the plain CRUD-style dashboard heading with a product-oriented hero, primary import action, demo group action, and high-signal metrics.
- Alternatives considered: keeping a simple list-first dashboard.
- Reason: In a live interview, the evaluator should immediately understand the differentiator: messy CSV import, explainable balances, and settlement recommendations.
- Impact: The demo can start from `/dashboard` and naturally flow into `/imports`, group detail, balance explanation, and recommendations.

### 2026-06-14 - Dashboard Prioritizes Interview Demo Flow
- Decision: Redesign the dashboard around four summary cards, interactive balances, Aisha's who-pays-whom view, activity, and upcoming settlement suggestions.
- Alternatives considered: adding only cosmetic styling to the existing dashboard.
- Reason: The previous dashboard looked like a CRUD admin panel and did not foreground the assignment's strongest story.
- Impact: The first screen now shows financial position, next actions, proof of balance logic, and demo-ready settlement guidance without requiring navigation.

### 2026-06-14 - Dashboard Data Stays Client-Composed
- Decision: Derive dashboard activity and settlement suggestions from existing group and balance endpoints.
- Alternatives considered: adding a dedicated dashboard API.
- Reason: The current backend already exposes enough data, and avoiding a new endpoint keeps the implementation simple and maintainable.
- Impact: The dashboard performs extra group-detail queries after groups load, but avoids backend churn and remains acceptable for the small internship dataset.

### 2026-06-14 - Group Pages Become Collaborative Workspaces
- Decision: Redesign group detail pages around a cover header, member avatar cards, balance chips, activity timeline, group health, and floating add-expense CTA.
- Alternatives considered: keeping panels of member/expense/settlement lists and only restyling them.
- Reason: The assignment demo benefits when a group feels like a living workspace where expenses, membership, health, and settlement status are understandable at a glance.
- Impact: Group pages no longer read as CRUD tables; they now emphasize collaboration, timeline context, and settlement progress while preserving existing APIs and forms.

### 2026-06-14 - Group Health Is Derived Client-Side
- Decision: Compute group health from current expenses, settlements, and open pairwise balance amount.
- Alternatives considered: adding a backend health endpoint.
- Reason: Existing data is enough for a clear demo indicator, and client-side derivation avoids backend changes.
- Impact: Health labels show `Needs activity`, `Healthy`, `Improving`, or `Needs settlement` based on simple explainable rules.

### 2026-06-14 - Expenses Become A Transaction Feed
- Decision: Replace plain expense list cards with expandable transaction-feed cards showing icon, payer avatar, split badge, participants, amount, relative time, and details.
- Alternatives considered: keeping expenses inside only the activity timeline.
- Reason: Expenses are the core object in the assignment, and a transaction-feed pattern is more familiar, polished, and demo-friendly than a CRUD list.
- Impact: Group pages now make expenses scannable and expandable while preserving direct navigation to expense explanations.

### 2026-06-14 - Expense Detail Prioritizes Explainability
- Decision: Rebuild expense detail around split visualization, calculation explanation, settlement impact, and chat.
- Alternatives considered: keeping the original split table and chat panel.
- Reason: The evaluator needs to see not only stored data, but how the app calculates and explains shared costs.
- Impact: Each expense now shows the financial logic visually and narratively without changing backend APIs.

### 2026-06-15 - CSV Import Becomes Premium Onboarding
- Decision: Transform CSV import into a six-step onboarding flow with drag-and-drop upload, animated parsing, preview, anomaly center, user decisions, and import summary.
- Alternatives considered: keeping the previous single-page upload plus row list.
- Reason: The assignment's most distinctive requirement is anomaly review; making it the signature experience strengthens the live demo.
- Impact: `/imports` now presents import as an auditable guided workflow rather than an admin utility.

### 2026-06-15 - Anomaly Center Uses Side-By-Side Review
- Decision: Show each anomaly row with original CSV data beside parsed preview data and explicit action buttons.
- Alternatives considered: select dropdowns inside raw row cards.
- Reason: Side-by-side comparison makes the app's no-silent-guessing policy visible and easier to defend to evaluators.
- Impact: Users can inspect row number, severity, explanation, suggested action, and final decision in one place.

### 2026-06-15 - Balance Amounts Open A Why Audit Trail
- Decision: Turn group balance amounts into explicit `Why?` audit links and redesign the explanation page as a financial running-total ledger.
- Alternatives considered: adding a modal on the group page or only showing raw explanation lines.
- Reason: Rohan's requirement is traceability, so the user should see every expense, every settlement, and the running total that produces the final balance.
- Impact: `/groups/:groupId/balances/:userId` now reads like a financial audit trail with summary metrics, chronological balance movement, contributor cards, settlement impact, and CSV row evidence.

### 2026-06-15 - Running Totals Stay Client-Side
- Decision: Calculate running totals in the frontend from chronological explanation lines returned by the backend.
- Alternatives considered: persisting audit-line running totals or adding a second backend endpoint.
- Reason: The backend already returns the source-of-truth movements in order; deriving running totals in the UI keeps the architecture simple for the 3-day build.
- Impact: The audit screen is explainable without schema churn, while the backend remains responsible for authorization and source financial events.

### 2026-06-15 - Demo Mode Uses Frontend Mock Responses
- Decision: Add Demo Mode as a frontend presentation layer with realistic sample data and mock responses for the key evaluation routes.
- Alternatives considered: requiring a seeded PostgreSQL database for the live demo or adding backend-only demo endpoints.
- Reason: The evaluation must be reliable in a 45-minute interview, and the final assignment CSV may not be available in every environment.
- Impact: `Ctrl + Shift + D` or the header toggle enables a demo session as Aisha with quick access to anomalies, import report, Rohan's balance audit, and Aisha's settlement recommendations while preserving normal API behavior when disabled.

### 2026-06-15 - Demo Mode Does Not Replace Relational Persistence
- Decision: Keep Demo Mode isolated from the real backend and database schema.
- Alternatives considered: inserting demo data automatically into PostgreSQL from the browser.
- Reason: Browser-side seeding would be unsafe and brittle; the real app still uses PostgreSQL/Prisma, while Demo Mode is only for presentation reliability.
- Impact: Demo Mode is fast to enable and easy to disable, but production correctness still depends on migrations, seed/import flows, and the relational database.

### 2026-06-15 - Framer Motion For Focused Polish
- Decision: Use Framer Motion only for route transitions and toast entrance/exit animations.
- Alternatives considered: CSS-only transitions or adding a larger UI animation system.
- Reason: The app needed visible polish for evaluation, but the implementation should stay small and easy to maintain.
- Impact: The app feels smoother and more premium, with the accepted trade-off of a larger client bundle and a Vite chunk-size warning.

### 2026-06-15 - Toasts Stay Lightweight And Global
- Decision: Add a small local `ToastProvider` instead of a third-party toast library.
- Alternatives considered: installing a notification package or keeping inline-only success states.
- Reason: A local provider covers the required feedback paths with minimal dependency and styling overhead.
- Impact: Common actions now give immediate feedback while preserving the existing React Query data flow.

### 2026-06-15 - Accessibility Polish Is Structural
- Decision: Add a skip link, stronger focus-ring usage on navigation, reduced-motion CSS, and accessible toast live regions.
- Alternatives considered: treating accessibility as only visual contrast and keyboard defaults.
- Reason: Keyboard navigation and motion preferences matter during a live demo and improve the app's professional feel.
- Impact: The UI is easier to navigate with keyboard and less jarring for users who prefer reduced motion.

### 2026-06-14 - Import UI Framed As A Control Room
- Decision: Present CSV import as a three-step control flow: upload, review, finalize.
- Alternatives considered: leaving upload and anomaly tables as plain forms.
- Reason: The assignment's strongest requirement is anomaly handling; the UI should make review and no-silent-guessing policy obvious.
- Impact: The import page now highlights audit safety, row review, anomaly severity, required approvals, and report generation.

### 2026-06-14 - Light/Dark Theme Uses CSS Variables
- Decision: Use CSS variables and a small localStorage-backed toggle rather than separate themed component trees.
- Alternatives considered: Tailwind dark variants on every component.
- Reason: Variables keep code simple and make future style changes centralized.
- Impact: Theme switching is smooth, shared primitives adapt automatically, and the app feels closer to modern SaaS tools like Linear, Stripe Dashboard, and Vercel.

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
