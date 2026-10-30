import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { HttpError } from "./http.js";

const TokenPayload = z.object({
  sub: z.string(),
  role: z.enum(["RIDER", "DISPATCHER"]),
});

export type AuthUser = { id: string; role: Role };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(secret: string, user: AuthUser): string {
  return jwt.sign({ role: user.role }, secret, { subject: user.id, expiresIn: "7d" });
}

export function requireAuth(secret: string): RequestHandler {
  return (req, _res, next) => {
    const header = req.header("authorization") ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new HttpError(401, "unauthorized", "Sign in to continue");
    }
    try {
      const payload = TokenPayload.parse(jwt.verify(token, secret));
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      throw new HttpError(401, "unauthorized", "Your session has expired. Sign in again");
    }
    next();
  };
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, "forbidden", "Your account cannot do this");
    }
    next();
  };
}
