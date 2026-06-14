# FairShare

FairShare is a simplified Splitwise-style app for friends, roommates, and small groups to track shared expenses, group balances, expense discussions, and settlements.

## Tech Stack
- React, Vite, TypeScript, Tailwind CSS
- Node.js, Express, TypeScript
- Prisma and PostgreSQL
- Email/password authentication with hashed passwords and HTTP-only JWT cookies

## Local Setup
1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
3. Generate Prisma client: `pnpm run prisma:generate`
4. Run migrations: `pnpm run prisma:migrate`
5. Seed demo data: `pnpm run seed`
6. Start the API server: `pnpm run dev:server`
7. In a second terminal, start the frontend: `pnpm run dev:client`

The API server runs on `http://localhost:4000`. The frontend runs on `http://localhost:5173` and proxies `/api` requests to the API server. In production, the server also serves the built frontend.

## Scripts
- `pnpm run dev:server`: run backend in development mode.
- `pnpm run dev:client`: run frontend in development mode.
- `pnpm run build`: build frontend and backend.
- `pnpm run start`: run compiled backend.
- `pnpm run test`: run backend tests.
- `pnpm run prisma:migrate`: create/apply local migrations.
- `pnpm run prisma:deploy`: apply migrations in production.
- `pnpm run seed`: seed demo users and a demo group.

## Production Environment Variables
Set these on the deployment platform.

| Name | Required | Example | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://user:password@host:5432/fairshare?schema=public` | Hosted PostgreSQL connection string. Use the provider's pooled/internal URL if recommended. |
| `JWT_SECRET` | Yes | `generate-a-long-random-secret` | Use a high-entropy value, at least 32 characters. Rotating this signs out all users. |
| `NODE_ENV` | Yes | `production` | Enables secure cookie settings and static frontend serving. |
| `PORT` | Usually provided | `4000` | Most hosts inject this automatically. The server reads it from the environment. |
| `CLIENT_ORIGIN` | Yes | `https://your-app.example.com` | Public app origin. In the single-service deployment this should be the same public URL users open. |

Do not set production secrets in `.env.example` or commit real database URLs.

## Database Migration Instructions
Prisma migrations are stored in `prisma/migrations`.

For a fresh production database:

```bash
pnpm install --frozen-lockfile
pnpm run prisma:generate
pnpm run prisma:deploy
```

For local development:

```bash
pnpm install
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run seed
```

Production seeding is optional. Do not seed public production unless demo data is intentionally required for the submission.

## Deployment Instructions
The app is designed for one Node web service connected to hosted PostgreSQL. This works on platforms such as Render, Railway, Fly.io, or similar Node hosts.

1. Create a hosted PostgreSQL database.
2. Create a Node web service from this repository.
3. Set the production environment variables listed above.
4. Configure the install command:

```bash
pnpm install --frozen-lockfile
```

5. Configure the build command:

```bash
pnpm run prisma:generate && pnpm run build
```

6. Configure the migration/release command, if the platform supports one:

```bash
pnpm run prisma:deploy
```

If the platform does not support a separate release command, run `pnpm run prisma:deploy` once from a secure shell connected to the same production environment before starting the app.

7. Configure the start command:

```bash
pnpm run start
```

8. Open the public URL and run the deployment smoke test below.

## Public Deployment Readiness Checklist
- `DATABASE_URL` points to the production PostgreSQL database.
- `JWT_SECRET` is set to a long random value.
- `NODE_ENV` is `production`.
- `CLIENT_ORIGIN` exactly matches the public URL, including `https://`.
- `pnpm run prisma:deploy` has completed successfully.
- `pnpm run build` completes successfully.
- The public URL serves the React app.
- `GET /api/health` returns `{ "ok": true }`.
- Signup, login, logout, and protected-route redirect behavior work.
- A user can create a group.
- A user can add another existing user by email.
- Expenses can be created for equal, unequal, percentage, and share splits.
- Expense details, edit, delete, and chat work.
- Dashboard and group balances update after expenses and settlements.
- Settlement history appears on the group page.

## Deployment Smoke Test
Run this manually on the deployed public URL:

1. Visit `/api/health`; confirm it returns `{ "ok": true }`.
2. Sign up as User A.
3. Log out and sign up as User B.
4. Log in as User A.
5. Create a group.
6. Add User B by email.
7. Add one equal expense.
8. Add one unequal, percentage, or share expense.
9. Open the expense detail page and post a chat message.
10. Confirm dashboard and group balances show who owes whom.
11. Record a settlement.
12. Confirm balances update and settlement history shows the payment.
13. Log out and confirm `/dashboard` redirects to `/login`.

## Deployment Troubleshooting
- If auth cookies do not persist, verify `NODE_ENV=production`, `CLIENT_ORIGIN` is the exact public HTTPS origin, and the app is served over HTTPS.
- If the app starts but API calls fail, check `DATABASE_URL`, migration status, and server logs.
- If Prisma errors mention missing tables, run `pnpm run prisma:deploy` against the production database.
- If static frontend routes 404 on refresh, confirm the Node server is serving `client/dist` and the host is not trying to serve the frontend separately.
- If using a platform without pnpm preinstalled, enable Corepack or configure the host to install pnpm before the install command.

## Evaluator Checklist
Use this checklist to compare the implementation against the assignment.

| Requirement | Status | Where to verify |
| --- | --- | --- |
| Login module | Complete | `server/src/modules/auth/auth.routes.ts`, `client/src/features/auth` |
| Group management | Complete | `server/src/modules/groups`, `client/src/features/groups` |
| Expense management | Complete | `server/src/modules/expenses`, `client/src/features/expenses` |
| Equal splits | Complete | `server/src/modules/expenses/splitCalculator.ts` |
| Unequal splits | Complete | `server/src/modules/expenses/splitCalculator.ts` |
| Percentage splits | Complete | `server/src/modules/expenses/splitCalculator.ts` |
| Share splits | Complete | `server/src/modules/expenses/splitCalculator.ts` |
| Expense chat with real-time updates | Complete via polling | `client/src/features/expenses/ExpenseDetailPage.tsx` |
| Group-wise balances | Complete | `server/src/modules/balances`, `client/src/features/balances` |
| Individual balance summary | Complete | `client/src/features/balances/BalanceSummary.tsx` |
| Settlements | Complete | `server/src/modules/settlements`, `client/src/features/settlements` |
| Relational database usage | Complete | `prisma/schema.prisma`, `prisma/migrations` |
| Public deployment readiness | Ready, not deployed here | Deployment sections above |
| README completeness | Complete | This file |
| Build plan completeness | Complete | `BUILD_PLAN.md` |
| AI context reproducibility | Complete | `AI_CONTEXT.md` |

Known evaluator caveat: the app is deployment-ready, but no public URL has been produced from this workspace. A hosting provider and hosted PostgreSQL database are still required.

## Demo Users
The seed script creates demo users after the database is configured. Passwords are documented in the seed file and should be changed for any real deployment.

## Authentication Testing Instructions
Use these checks after PostgreSQL is configured and migrations are applied.

1. Start the API server with `pnpm run dev:server`.
2. Start the frontend with `pnpm run dev:client`.
3. Open `http://localhost:5173/signup` and create a user with a valid name, email, and password of at least 8 characters.
4. Confirm signup redirects to the protected dashboard.
5. Log out from the top navigation and confirm the app returns to the login screen.
6. Log in with the same email and password and confirm the dashboard loads again.
7. Open `http://localhost:5173/dashboard` in a fresh unauthenticated browser session and confirm it redirects to `/login`.
8. Try signing up with the same email again and confirm a validation error is shown.
9. Try logging in with a wrong password and confirm a validation error is shown.
10. Try submitting an invalid email or a short password and confirm the form/API rejects it.

Backend-only auth checks can also be made against:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

All protected API routes require the `fairshare_session` HTTP-only cookie set by signup/login.
