import { randomBytes } from "node:crypto";
import type { VercelRequest, VercelResponse } from "./_lib/types.js";
import { CONSENT_VERSION, STEP_QUESTIONS } from "../src/formData.js";
import { sendConsentPdf } from "./_lib/email.js";
import { createConsentPdf } from "./_lib/pdf.js";
import {
  methodNotAllowed,
  readInvitationToken,
  readRequestBody,
  safeText,
  sendJson,
  type ConsentRecord,
} from "./_lib/storage.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return methodNotAllowed(response, "POST");
  const body = await readRequestBody(request);
  const token = safeText(body.token, 2000);
  const invitation = readInvitationToken(token);
  if (!invitation) {
    return sendJson(response, 404, { error: "El enlace no es válido o ya venció." });
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

  const now = new Date().toISOString();
  const record: ConsentRecord = {
    id: randomBytes(8).toString("hex"),
    invitation,
    answers: answers as Record<string, "yes" | "no">,
    medicationDetails,
    sensitivityDetails,
    consentVersion: CONSENT_VERSION,
    acceptedAt: now,
    submittedAt: now,
  };

  try {
    const pdf = await createConsentPdf(record);
    const sent = await sendConsentPdf(record, pdf);
    if (!sent) {
      console.error("consent_email_not_sent");
      return sendJson(response, 503, {
        error: "No se pudo enviar el formulario. Inténtalo nuevamente o avisa a la profesional.",
      });
    }
    return sendJson(response, 200, {
      ok: true,
      message: "Formulario recibido y PDF enviado a la profesional.",
    });
  } catch {
    console.error("consent_submission_failed");
    return sendJson(response, 503, {
      error: "No se pudo enviar el formulario. Inténtalo nuevamente.",
    });
  }
}
