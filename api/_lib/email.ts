import { get } from "@vercel/blob";
import { Resend } from "resend";
import type { ConsentRecord } from "./storage";

export async function sendConsentPdf(record: ConsentRecord) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const recipient = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !from || !recipient) return false;

  const pdfBlob = await get(record.pdfPath, { access: "private" });
  if (!pdfBlob || pdfBlob.statusCode !== 200 || !pdfBlob.stream) {
    throw new Error("Consent PDF is not available.");
  }
  const pdf = Buffer.from(await new Response(pdfBlob.stream).arrayBuffer());
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [recipient],
    subject: "Lash by Katty - Nuevo consentimiento recibido",
    text: [
      "Hola Katty:",
      "",
      "Se ha recibido un nuevo consentimiento informado.",
      `Solicitud: ${record.id}`,
      `Servicio: ${record.invitation.service}`,
      `Fecha de recepción: ${record.submittedAt}`,
      "Estado: Completado",
      "El PDF con las respuestas está adjunto.",
    ].join("\n"),
    attachments: [{
      filename: `consentimiento-${record.id}.pdf`,
      content: pdf,
    }],
  }, { idempotencyKey: `consent/${record.id}` });
  if (error || !data?.id) return false;
  return true;
}
