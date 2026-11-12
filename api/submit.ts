import { randomBytes } from "node:crypto";
import { get, put } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "./_lib/types";
import { CONSENT_VERSION, STEP_QUESTIONS } from "../src/formData";
import { sendConsentPdf } from "./_lib/email";
import { createConsentPdf } from "./_lib/pdf";
import {
  methodNotAllowed,
  readJson,
  readRequestBody,
  safeText,
  sendJson,
  sha256,
  writeJson,
  type ConsentRecord,
  type Invitation,
} from "./_lib/storage";

type SubmissionBody = {
  token?: unknown;
  answers?: unknown;
  medicationDetails?: unknown;
  sensitivityDetails?: unknown;
  consentAccepted?: unknown;
  consentVersion?: unknown;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return methodNotAllowed(response, "POST");
  const body = await readRequestBody(request) as SubmissionBody;
  const token = safeText(body.token, 100);
  if (!/^[\w-]{40,50}$/.test(token)) {
    return sendJson(response, 400, { error: "El enlace no es válido." });
  }
  if (body.consentAccepted !== true || body.consentVersion !== CONSENT_VERSION) {
    return sendJson(response, 400, { error: "La declaración debe aceptarse antes de enviar." });
  }

  const questionIds = Object.values(STEP_QUESTIONS).flat().map(({ id }) => id);
  const submittedAnswers = body.answers;
  if (!submittedAnswers || typeof submittedAnswers !== "object" || Array.isArray(submittedAnswers)) {
    return sendJson(response, 400, { error: "Las respuestas enviadas no son válidas." });
  }
  const answers = submittedAnswers as Record<string, unknown>;
  if (
    questionIds.some((id) => answers[id] !== "yes" && answers[id] !== "no") ||
    Object.keys(answers).some((id) => !questionIds.includes(id))
  ) {
    return sendJson(response, 400, { error: "Responde Sí o No a todas las preguntas requeridas." });
  }

  const medicationDetails = safeText(body.medicationDetails, 2000);
  const sensitivityDetails = safeText(body.sensitivityDetails, 2000);
  if (
    ["antibiotics", "regularMedication", "eyeMedication"].some((id) => answers[id] === "yes") &&
    !medicationDetails
  ) {
    return sendJson(response, 400, { error: "Completa el detalle de medicamentos o tratamientos." });
  }
  if (
    ["environmentalAllergies", "previousServiceSensitivity"].some((id) => answers[id] === "yes") &&
    !sensitivityDetails
  ) {
    return sendJson(response, 400, { error: "Completa el detalle de alergias o sensibilidades." });
  }

  const tokenHash = sha256(token);
  const invitationPath = `invitations/${tokenHash}.json`;
  const submissionPath = `consents/${tokenHash}.json`;
  try {
    const invitation = await readJson<Invitation>(invitationPath);
    if (!invitation || new Date(invitation.expiresAt).getTime() <= Date.now()) {
      return sendJson(response, 404, { error: "El enlace no es válido o ya venció." });
    }

    let record = await readJson<ConsentRecord>(submissionPath);
    if (!record) {
      record = {
        id: randomBytes(12).toString("hex"),
        invitationId: invitation.id,
        tokenHash,
        invitation,
        answers: answers as Record<string, "yes" | "no">,
        medicationDetails,
        sensitivityDetails,
        consentVersion: CONSENT_VERSION,
        acceptedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        pdfPath: `pdf/${tokenHash}.pdf`,
        emailStatus: "pending",
        processingStatus: "pending",
      };
      try {
        await writeJson(submissionPath, record);
      } catch {
        record = await readJson<ConsentRecord>(submissionPath);
        if (!record) throw new Error("Unable to create consent record.");
      }
    }

    const existingPdf = await get(record.pdfPath, { access: "private" });
    let pdfBytes: Uint8Array;
    if (existingPdf?.statusCode === 200 && existingPdf.stream) {
      pdfBytes = new Uint8Array(await new Response(existingPdf.stream).arrayBuffer());
    } else {
      pdfBytes = await createConsentPdf(record);
      await put(record.pdfPath, pdfBytes, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "application/pdf",
        cacheControlMaxAge: 60,
      });
    }

    record.processingStatus = "completed";
    await writeJson(submissionPath, record, true);

    if (record.emailStatus !== "sent") {
      try {
        record.emailStatus = await sendConsentPdf(record) ? "sent" : "pending";
      } catch {
        console.error("consent_email_delivery_failed");
        record.emailStatus = "pending";
      }
      await writeJson(submissionPath, record, true);
    }

    return sendJson(response, record.emailStatus === "sent" ? 200 : 202, {
      ok: true,
      emailStatus: record.emailStatus,
      message: record.emailStatus === "sent"
        ? "Formulario recibido y PDF enviado a la profesional."
        : "Formulario recibido; el correo está pendiente de configuración o reintento.",
    });
  } catch {
    console.error("consent_submission_failed");
    return sendJson(response, 503, { error: "No se pudo completar el envío. Inténtalo nuevamente." });
  }
}
