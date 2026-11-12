import { Resend } from "resend";
import type { ConsentRecord } from "./storage.js";

export async function sendConsentPdf(record: ConsentRecord, pdf: Uint8Array) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const recipient = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !from || !recipient) return false;

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [recipient],
    subject: "Lash by Katty - Nuevo consentimiento recibido",
    text: [
      "Hola Katty:",
      "",
      "Se ha recibido un nuevo consentimiento informado.",
      `Paciente: ${record.invitation.firstName} ${record.invitation.lastName}`,
      `Servicio: ${record.invitation.service}`,
      `Fecha de recepción: ${record.submittedAt}`,
      "El PDF con las respuestas está adjunto.",
    ].join("\n"),
    attachments: [{
      filename: `consentimiento-${record.id}.pdf`,
      content: Buffer.from(pdf),
    }],
  }, { idempotencyKey: `consent/${record.id}` });
  return !error && Boolean(data?.id);
}
