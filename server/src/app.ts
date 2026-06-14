import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env, isProduction } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { balancesRouter } from "./modules/balances/balances.routes.js";
import { expensesRouter } from "./modules/expenses/expenses.routes.js";
import { groupsRouter } from "./modules/groups/groups.routes.js";
import { settlementsRouter } from "./modules/settlements/settlements.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(morgan(isProduction ? "combined" : "dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/settlements", settlementsRouter);
app.use("/api/balances", balancesRouter);

if (isProduction) {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use(errorHandler);
