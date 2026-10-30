import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../http.js";
import { requireAuth, signToken } from "../auth.js";

const SignInBody = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

function publicUser(u: { id: string; email: string; name: string; role: string; vehicle: string | null }) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, vehicle: u.vehicle };
}

export function authRouter(secret: string): Router {
  const router = Router();

  router.post("/sign-in", async (req, res) => {
    const body = SignInBody.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    const ok = user ? await bcrypt.compare(body.password, user.passwordHash) : false;
    if (!user || !ok) {
      throw new HttpError(401, "invalid_credentials", "Email or password is incorrect");
    }
    if (user.role !== "RIDER") {
      throw new HttpError(403, "forbidden", "Only riders can sign in to this app");
    }
    res.json({ token: signToken(secret, { id: user.id, role: user.role }), user: publicUser(user) });
  });

  router.get("/me", requireAuth(secret), async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(401, "unauthorized", "Account no longer exists");
    res.json({ user: publicUser(user) });
  });

  return router;
}
