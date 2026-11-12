import type { VercelRequest, VercelResponse } from "../_lib/types.js";
import {
  methodNotAllowed,
  parseBody,
  passwordMatches,
  sameOrigin,
  sendJson,
  setAdminCookie,
} from "../_lib/storage.js";

const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  current.count += 1;
  return current.count > 10;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return methodNotAllowed(response, "POST");
  if (!sameOrigin(request)) return sendJson(response, 403, { error: "Origen no permitido." });

  const ipHeader = request.headers["x-forwarded-for"];
  const ip = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader?.split(",")[0] ?? "unknown";
  if (isRateLimited(ip)) return sendJson(response, 429, { error: "Demasiados intentos. Espera unos minutos." });

  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  const password = parseBody(request).password;
  if (!expectedHash) {
    return sendJson(response, 503, { error: "El acceso administrativo aún no está configurado." });
  }
  if (typeof password !== "string" || !passwordMatches(password, expectedHash)) {
    return sendJson(response, 401, { error: "Contraseña incorrecta." });
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    return sendJson(response, 503, { error: "La sesión administrativa no está configurada." });
  }

  setAdminCookie(response);
  return sendJson(response, 200, { ok: true });
}
