import type { VercelRequest, VercelResponse } from "../_lib/types.js";
import { clearAdminCookie, methodNotAllowed, sameOrigin, sendJson } from "../_lib/storage.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return methodNotAllowed(response, "POST");
  if (!sameOrigin(request)) return sendJson(response, 403, { error: "Origen no permitido." });
  clearAdminCookie(response);
  return sendJson(response, 200, { ok: true });
}
