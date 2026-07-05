import type { FastifyInstance } from "fastify";
import { calculateDailyTargets } from "@larpfatless/shared/nutrition";
import { prisma } from "../db.js";
import { createAuthToken, getUserIdFromRequest, hashPassword, verifyPassword } from "../lib/auth.js";
import { serializeUser } from "../lib/serializers.js";

type ProfilePayload = {
  sex: "male" | "female";
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "athlete";
  goal: "lose" | "maintain" | "gain";
};

function getTargets(profile: ProfilePayload) {
  return calculateDailyTargets(profile);
}

export async function accountRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const body = request.body as {
      email?: string;
      password?: string;
      displayName?: string;
      profile?: ProfilePayload;
    };

    if (!body.email || !body.password || !body.profile) {
      return reply.code(400).send({ message: "Email, пароль и профиль обязательны." });
    }

    const email = body.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ message: "Пользователь с таким email уже существует." });
    }

    const targets = getTargets(body.profile);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(body.password),
        displayName: body.displayName?.trim() || null,
        ...body.profile,
        dailyCalories: targets.calories,
        proteinTarget: targets.protein,
        fatTarget: targets.fat,
        carbsTarget: targets.carbs
      }
    });

    return reply.send({ token: createAuthToken(user.id), user: serializeUser(user) });
  });

  app.post("/auth/login", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return reply.code(400).send({ message: "Введите email и пароль." });
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase().trim() }
    });

    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return reply.code(401).send({ message: "Неверный email или пароль." });
    }

    return reply.send({ token: createAuthToken(user.id), user: serializeUser(user) });
  });

  app.get("/profile", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return reply.code(401).send({ message: "Нужно войти в аккаунт." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.code(404).send({ message: "Профиль не найден." });
    }

    return reply.send({ user: serializeUser(user) });
  });

  app.put("/profile", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return reply.code(401).send({ message: "Нужно войти в аккаунт." });
    }

    const body = request.body as Partial<ProfilePayload> & { displayName?: string };
    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (!current) {
      return reply.code(404).send({ message: "Профиль не найден." });
    }

    const nextProfile: ProfilePayload = {
      sex: body.sex ?? current.sex,
      age: body.age ?? current.age,
      heightCm: body.heightCm ?? current.heightCm,
      weightKg: Number(body.weightKg ?? current.weightKg),
      activityLevel: body.activityLevel ?? current.activityLevel,
      goal: body.goal ?? current.goal
    };
    const targets = getTargets(nextProfile);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...nextProfile,
        displayName: body.displayName?.trim() ?? current.displayName,
        dailyCalories: targets.calories,
        proteinTarget: targets.protein,
        fatTarget: targets.fat,
        carbsTarget: targets.carbs
      }
    });

    return reply.send({ user: serializeUser(user) });
  });
}
