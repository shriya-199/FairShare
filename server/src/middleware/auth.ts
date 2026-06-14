import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env, isProduction } from "../config/env.js";
import { prisma } from "../prisma/client.js";
import { HttpError } from "../utils/http.js";

const cookieName = "fairshare_session";

export function signSession(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "7d" });
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction
  });
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token) throw new HttpError(401, "Authentication required");

    const payload = jwt.verify(token, env.JWT_SECRET);
    const userId = typeof payload === "object" && payload.sub ? String(payload.sub) : null;
    if (!userId) throw new HttpError(401, "Invalid session");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });
    if (!user) throw new HttpError(401, "Invalid session");

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof HttpError) next(error);
    else next(new HttpError(401, "Invalid session"));
  }
}
