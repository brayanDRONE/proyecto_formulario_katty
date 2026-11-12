import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "./types.js";

export type Invitation = {
  id: string;
  firstName: string;
  lastName: string;
  service: string;
  rut: string | null;
  appointmentDate: string | null;
  createdAt: string;
  expiresAt: string;
};

export type ConsentRecord = {
  id: string;
  invitation: Invitation;
  answers: Record<string, "yes" | "no">;
  medicationDetails: string;
  sensitivityDetails: string;
  consentVersion: string;
  acceptedAt: string;
  submittedAt: string;
};

export function sendJson(
  response: VercelResponse,
  status: number,
  body: Record<string, unknown>,
) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(body);
}

export function methodNotAllowed(response: VercelResponse, allowed: string) {
  response.setHeader("Allow", allowed);
  return sendJson(response, 405, { error: "Método no permitido." });
}

export function parseBody(request: VercelRequest): Record<string, unknown> {
  if (request.body && typeof request.body === "object") {
    return request.body as Record<string, unknown>;
  }
  if (typeof request.body === "string") {
    try {
      const parsed: unknown = JSON.parse(request.body);
      return parsed && typeof parsed === "object"
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createInvitationToken(invitation: Invitation) {
  const payload = Buffer.from(JSON.stringify(invitation)).toString("base64url");
  return `${payload}.${sign(`invitation:${payload}`)}`;
}

export function readInvitationToken(token: string): Invitation | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = Buffer.from(sign(`invitation:${payload}`));
    const provided = Buffer.from(signature);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      return null;
    }
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Invitation;
    if (new Date(data.expiresAt).getTime() <= Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function createAdminCookie() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isAdminAuthenticated(request: VercelRequest) {
  try {
    const cookie = request.cookies?.lbk_session;
    if (!cookie) return false;
    const [payload, signature] = cookie.split(".");
    if (!payload || !signature) return false;

    const expected = Buffer.from(sign(payload));
    const provided = Buffer.from(signature);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      return false;
    }

    const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());
    return Boolean(
      data &&
      typeof data === "object" &&
      "exp" in data &&
      typeof data.exp === "number" &&
      data.exp > Date.now(),
    );
  } catch {
    return false;
  }
}

export function setAdminCookie(response: VercelResponse) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `lbk_session=${createAdminCookie()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`,
  );
}

export function clearAdminCookie(response: VercelResponse) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `lbk_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
  );
}

export function passwordMatches(candidate: string, encodedHash: string) {
  const [algorithm, saltText, hashText] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !saltText || !hashText) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    if (salt.length < 16 || expected.length !== 64) return false;
    const actual = scryptSync(candidate, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function sameOrigin(request: VercelRequest) {
  const origin = request.headers.origin;
  const configuredOrigin = process.env.APP_BASE_URL;
  if (!origin || !configuredOrigin) return false;
  try {
    return new URL(origin).origin === new URL(configuredOrigin).origin;
  } catch {
    return false;
  }
}

export function requireAdmin(request: VercelRequest, response: VercelResponse) {
  if (isAdminAuthenticated(request)) return true;
  sendJson(response, 401, { error: "Inicia sesión para continuar." });
  return false;
}

export function safeText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function readRequestBody(request: VercelRequest) {
  const parsed = parseBody(request);
  if (Object.keys(parsed).length > 0) return parsed;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  try {
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return body && typeof body === "object"
      ? body as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}
