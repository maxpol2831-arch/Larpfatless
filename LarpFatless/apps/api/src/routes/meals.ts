import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { getUserIdFromRequest } from "../lib/auth.js";
import { serializeMeal } from "../lib/serializers.js";

type MealPayload = {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  eatenAt: string;
  dishName: string;
  photoUri?: string;
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbsGrams: number;
  portionGrams: number;
  confidence?: number;
  ingredients?: { name: string; estimatedGrams: number }[];
};

export async function mealRoutes(app: FastifyInstance) {
  app.get("/meals", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return reply.code(401).send({ message: "Нужно войти в аккаунт." });
    }

    const meals = await prisma.meal.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { eatenAt: "desc" }
    });

    return reply.send({ meals: meals.map(serializeMeal) });
  });

  app.post("/meals", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return reply.code(401).send({ message: "Нужно войти в аккаунт." });
    }

    const body = request.body as MealPayload;
    const meal = await prisma.meal.create({
      data: {
        userId,
        mealType: body.mealType,
        eatenAt: new Date(body.eatenAt),
        title: body.dishName,
        photoUrl: body.photoUri,
        calories: body.calories,
        proteinGrams: body.proteinGrams,
        fatGrams: body.fatGrams,
        carbsGrams: body.carbsGrams,
        portionGrams: body.portionGrams,
        confidence: body.confidence,
        source: "app",
        items: {
          create:
            body.ingredients?.map((item) => ({
              name: item.name,
              grams: item.estimatedGrams,
              calories: 0,
              proteinGrams: 0,
              fatGrams: 0,
              carbsGrams: 0
            })) ?? []
        }
      },
      include: { items: true }
    });

    return reply.send({ meal: serializeMeal(meal) });
  });

  app.put("/meals/:id", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return reply.code(401).send({ message: "Нужно войти в аккаунт." });
    }

    const { id } = request.params as { id: string };
    const body = request.body as MealPayload;
    const existing = await prisma.meal.findFirst({
      where: { id, userId }
    });
    if (!existing) {
      return reply.code(404).send({ message: "Запись не найдена." });
    }

    await prisma.mealItem.deleteMany({ where: { mealId: id } });
    const meal = await prisma.meal.update({
      where: { id },
      data: {
        mealType: body.mealType,
        eatenAt: new Date(body.eatenAt),
        title: body.dishName,
        photoUrl: body.photoUri,
        calories: body.calories,
        proteinGrams: body.proteinGrams,
        fatGrams: body.fatGrams,
        carbsGrams: body.carbsGrams,
        portionGrams: body.portionGrams,
        confidence: body.confidence,
        items: {
          create:
            body.ingredients?.map((item) => ({
              name: item.name,
              grams: item.estimatedGrams,
              calories: 0,
              proteinGrams: 0,
              fatGrams: 0,
              carbsGrams: 0
            })) ?? []
        }
      },
      include: { items: true }
    });

    return reply.send({ meal: serializeMeal(meal) });
  });

  app.delete("/meals/:id", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return reply.code(401).send({ message: "Нужно войти в аккаунт." });
    }

    const { id } = request.params as { id: string };
    const existing = await prisma.meal.findFirst({
      where: { id, userId }
    });
    if (!existing) {
      return reply.code(404).send({ message: "Запись не найдена." });
    }

    await prisma.meal.delete({ where: { id } });
    return reply.send({ ok: true });
  });
}
