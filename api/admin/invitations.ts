import { randomBytes } from "node:crypto";
import type { VercelRequest, VercelResponse } from "../_lib/types";
import {
  createInvitationToken,
  methodNotAllowed,
  readRequestBody,
  requireAdmin,
  safeText,
  sameOrigin,
  sendJson,
  type Invitation,
} from "../_lib/storage";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === "GET") {
    if (!requireAdmin(request, response)) return;
    return sendJson(response, 200, { ok: true });
  }
  if (request.method !== "POST") return methodNotAllowed(response, "GET, POST");
  if (!requireAdmin(request, response)) return;
  if (!sameOrigin(request)) return sendJson(response, 403, { error: "Origen no permitido." });

  const body = await readRequestBody(request);
  const firstName = safeText(body.firstName, 100);
  const lastName = safeText(body.lastName, 100);
  const rut = safeText(body.rut, 20);
  const service = safeText(body.service, 80);
  const appointmentDate = safeText(body.appointmentDate, 20);
  if (!firstName || !lastName || !["Lifting de pestañas", "Extensiones de pestañas"].includes(service)) {
    return sendJson(response, 400, { error: "Completa nombre, apellido y un servicio válido." });
  }
  if (appointmentDate && !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    return sendJson(response, 400, { error: "La fecha de atención no es válida." });
  }

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) return sendJson(response, 503, { error: "Falta configurar APP_BASE_URL." });

  const ttl = Number(process.env.INVITATION_TTL_DAYS ?? 7);
  const ttlDays = Number.isInteger(ttl) && ttl >= 1 && ttl <= 30 ? ttl : 7;
  const createdAt = new Date();
  const invitation: Invitation = {
    id: randomBytes(8).toString("hex"),
    firstName,
    lastName,
    rut: rut || null,
    service,
    appointmentDate: appointmentDate || null,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + ttlDays * 86400000).toISOString(),
  };

  return sendJson(response, 201, {
    invitation,
    link: `${baseUrl.replace(/\/$/, "")}/consentimiento/${createInvitationToken(invitation)}`,
  });
}
