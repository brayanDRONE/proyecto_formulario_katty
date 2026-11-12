import type { VercelRequest, VercelResponse } from "../_lib/types";
import { sendConsentPdf } from "../_lib/email";
import {
  isAdminAuthenticated,
  methodNotAllowed,
  readJson,
  readRequestBody,
  requireAdmin,
  sameOrigin,
  sendJson,
  writeJson,
  type ConsentRecord,
} from "../_lib/storage";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return methodNotAllowed(response, "POST");
  if (!isAdminAuthenticated(request)) return requireAdmin(request, response);
  if (!sameOrigin(request)) return sendJson(response, 403, { error: "Origen no permitido." });

  const body = await readRequestBody(request);
  const recordKey = typeof body.recordKey === "string" ? body.recordKey : "";
  if (!/^[a-f0-9]{64}$/.test(recordKey)) {
    return sendJson(response, 400, { error: "El registro no es válido." });
  }

  try {
    const path = `consents/${recordKey}.json`;
    const record = await readJson<ConsentRecord>(path);
    if (!record || record.processingStatus !== "completed") {
      return sendJson(response, 404, { error: "El registro no está disponible." });
    }
    if (record.emailStatus === "sent") {
      return sendJson(response, 200, { emailStatus: "sent" });
    }

    record.emailStatus = await sendConsentPdf(record) ? "sent" : "pending";
    await writeJson(path, record, true);
    return sendJson(response, 200, { emailStatus: record.emailStatus });
  } catch {
    console.error("consent_email_retry_failed");
    return sendJson(response, 503, { error: "No se pudo reintentar el correo. Verifica la configuración de Resend." });
  }
}
