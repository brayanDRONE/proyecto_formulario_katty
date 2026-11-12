import { get } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "../_lib/types";
import {
  isAdminAuthenticated,
  methodNotAllowed,
  readJson,
  requireAdmin,
  sendJson,
  type ConsentRecord,
} from "../_lib/storage";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") return methodNotAllowed(response, "GET");
  if (!isAdminAuthenticated(request)) return requireAdmin(request, response);

  const recordKey = typeof request.query.key === "string" ? request.query.key : "";
  if (!/^[a-f0-9]{64}$/.test(recordKey)) {
    return sendJson(response, 404, { error: "El documento no está disponible." });
  }

  try {
    const record = await readJson<ConsentRecord>(`consents/${recordKey}.json`);
    if (!record || record.processingStatus !== "completed") {
      return sendJson(response, 404, { error: "El documento no está disponible." });
    }

    const pdf = await get(record.pdfPath, { access: "private" });
    if (!pdf || pdf.statusCode !== 200 || !pdf.stream) {
      return sendJson(response, 404, { error: "El documento no está disponible." });
    }
    const bytes = Buffer.from(await new Response(pdf.stream).arrayBuffer());
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename="consentimiento-${record.id}.pdf"`);
    response.setHeader("Cache-Control", "private, no-store");
    return response.status(200).send(bytes);
  } catch {
    return sendJson(response, 503, { error: "No se pudo descargar el documento." });
  }
}
