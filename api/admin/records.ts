import { list } from "@vercel/blob";
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

  try {
    const { blobs } = await list({ prefix: "consents/", limit: 1000 });
    const records = await Promise.all(
      blobs.map(({ pathname }) => readJson<ConsentRecord>(pathname)),
    );
    return sendJson(response, 200, {
      records: records
        .filter((record): record is ConsentRecord => record !== null)
        .filter((record) => record.processingStatus === "completed")
        .map((record) => ({
          id: record.id,
          recordKey: record.tokenHash,
          firstName: record.invitation.firstName,
          lastName: record.invitation.lastName,
          service: record.invitation.service,
          submittedAt: record.submittedAt,
          emailStatus: record.emailStatus,
        }))
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    });
  } catch {
    return sendJson(response, 503, { error: "No se pudieron cargar los registros desde Blob." });
  }
}
