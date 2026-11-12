import type { VercelRequest, VercelResponse } from "./_lib/types";
import { methodNotAllowed, readJson, sendJson, sha256, type ConsentRecord, type Invitation } from "./_lib/storage";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") return methodNotAllowed(response, "GET");
  const token = typeof request.query.token === "string" ? request.query.token : "";
  if (!/^[\w-]{40,50}$/.test(token)) {
    return sendJson(response, 404, { error: "El enlace no es válido o ya no está disponible." });
  }

  try {
    const tokenHash = sha256(token);
    const invitation = await readJson<Invitation>(`invitations/${tokenHash}.json`);
    if (!invitation || new Date(invitation.expiresAt).getTime() <= Date.now()) {
      return sendJson(response, 404, { error: "El enlace no es válido o ya venció." });
    }
    const submission = await readJson<ConsentRecord>(`consents/${tokenHash}.json`);
    if (submission?.processingStatus === "completed") {
      return sendJson(response, 410, { error: "Este formulario ya fue respondido." });
    }
    return sendJson(response, 200, {
      invitation: {
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        service: invitation.service,
        appointmentDate: invitation.appointmentDate,
      },
    });
  } catch {
    return sendJson(response, 503, { error: "No se pudo verificar el enlace. Inténtalo más tarde." });
  }
}
