import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { env } from "../env.js";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export function createAuthToken(userId: string) {
  const issuedAt = Date.now();
  const payload = `${userId}.${issuedAt}`;
  const signature = createHmac("sha256", env.authSecret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyAuthToken(token: string) {
  const [userId, issuedAtRaw, signature] = token.split(".");
  const issuedAt = Number(issuedAtRaw);
  if (!userId || !Number.isFinite(issuedAt) || !signature || Date.now() - issuedAt > TOKEN_TTL_MS) {
    return null;
  }

  const payload = `${userId}.${issuedAt}`;
  const expected = createHmac("sha256", env.authSecret).update(payload).digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? userId : null;
}

export function getUserIdFromRequest(request: FastifyRequest) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  return token ? verifyAuthToken(token) : null;
}
