import type { VercelRequest, VercelResponse } from "./_lib/types.js";
import { methodNotAllowed, readInvitationToken, sendJson } from "./_lib/storage.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") return methodNotAllowed(response, "GET");
  const token = typeof request.query.token === "string" ? request.query.token : "";
  const invitation = token.length <= 2000 ? readInvitationToken(token) : null;
  if (!invitation) {
    return sendJson(response, 404, { error: "El enlace no es válido o ya venció." });
  }
  return sendJson(response, 200, {
    invitation: {
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      service: invitation.service,
      appointmentDate: invitation.appointmentDate,
    },
  });
}
