import { randomBytes } from "node:crypto";
import { list } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "../_lib/types";
import {
  isAdminAuthenticated,
  methodNotAllowed,
  readJson,
  readRequestBody,
  requireAdmin,
  safeText,
  sameOrigin,
  sendJson,
  sha256,
  writeJson,
  type Invitation,
} from "../_lib/storage";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!["GET", "POST"].includes(request.method ?? "")) {
    return methodNotAllowed(response, "GET, POST");
  }
  if (!isAdminAuthenticated(request)) return requireAdmin(request, response);

  if (request.method === "GET") {
    try {
      const { blobs } = await list({ prefix: "invitations/", limit: 1000 });
      const invitations = await Promise.all(
        blobs.map((blob) => readJson<Invitation>(blob.pathname)),
      );
      return sendJson(response, 200, {
        invitations: invitations.filter((invitation): invitation is Invitation => invitation !== null)
          .map(({ id, firstName, lastName, service, createdAt, expiresAt }) => ({
            id, firstName, lastName, service, createdAt, expiresAt,
          }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      });
    } catch {
      return sendJson(response, 503, { error: "No se pudieron cargar las solicitudes desde Blob." });
    }
  }

  if (!sameOrigin(request)) return sendJson(response, 403, { error: "Origen no permitido." });
  const body = await readRequestBody(request);
  const firstName = safeText(body.firstName, 100);
  const lastName = safeText(body.lastName, 100);
  const rut = safeText(body.rut, 20);
  const service = safeText(body.service, 80);
  const appointmentDate = safeText(body.appointmentDate, 20);
  const notes = safeText(body.notes, 1000);
  if (!firstName || !lastName || !["Lifting de pestañas", "Extensiones de pestañas"].includes(service)) {
    return sendJson(response, 400, { error: "Completa nombre, apellido y un servicio válido." });
  }
  if (appointmentDate && !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    return sendJson(response, 400, { error: "La fecha de atención no es válida." });
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = sha256(token);
  const id = randomBytes(12).toString("hex");
  const ttl = Number(process.env.INVITATION_TTL_DAYS ?? 7);
  const ttlDays = Number.isInteger(ttl) && ttl >= 1 && ttl <= 30 ? ttl : 7;
  const createdAt = new Date();
  const invitation: Invitation = {
    id,
    firstName,
    lastName,
    rut: rut || null,
    service,
    appointmentDate: appointmentDate || null,
    notes: notes || null,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + ttlDays * 86400000).toISOString(),
  };

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) return sendJson(response, 503, { error: "Falta configurar APP_BASE_URL." });

  try {
    await writeJson(`invitations/${tokenHash}.json`, invitation);
  } catch {
    return sendJson(response, 503, { error: "No se pudo guardar la solicitud en Blob." });
  }

  return sendJson(response, 201, {
    invitation,
    link: `${baseUrl.replace(/\/$/, "")}/consentimiento/${token}`,
  });
}
