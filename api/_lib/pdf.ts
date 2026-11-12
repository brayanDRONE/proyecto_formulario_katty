import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CONSENT_SUMMARY, FORM_STEPS, STEP_QUESTIONS } from "../../src/formData.js";
import type { ConsentRecord } from "./storage.js";

function pdfText(value: string) {
  return value
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[♡✓]/g, "")
    .replace(/[^\x00-\xFF]/g, " ");
}

export async function createConsentPdf(record: ConsentRecord) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const pageSize = { width: 595.28, height: 841.89 };
  const margin = 48;
  let page = document.addPage([pageSize.width, pageSize.height]);
  let y = pageSize.height - margin;

  const addPage = () => {
    page = document.addPage([pageSize.width, pageSize.height]);
    y = pageSize.height - margin;
  };

  const drawWrapped = (text: string, fontSize = 10, font = regular, indent = 0) => {
    const maxWidth = pageSize.width - margin * 2 - indent;
    const words = pdfText(text).split(/\s+/);
    let line = "";
    const lines: string[] = [];

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);

    for (const wrappedLine of lines) {
      if (y < margin + fontSize + 4) addPage();
      page.drawText(wrappedLine, {
        x: margin + indent,
        y,
        size: fontSize,
        font,
        color: rgb(0.29, 0.21, 0.23),
      });
      y -= fontSize + 5;
    }
  };

  const heading = (text: string) => {
    y -= 8;
    drawWrapped(text, 13, bold);
    y -= 5;
  };

  drawWrapped("Lash by Katty - Consentimiento informado", 18, bold);
  drawWrapped(`Identificador: ${record.id}`, 9);
  drawWrapped(`Fecha de recepción: ${record.submittedAt}`, 9);
  drawWrapped(`Servicio: ${record.invitation.service}`, 10, bold);
  drawWrapped(`Paciente: ${record.invitation.firstName} ${record.invitation.lastName}`, 10);
  if (record.invitation.rut) drawWrapped(`RUT: ${record.invitation.rut}`, 10);
  if (record.invitation.appointmentDate) {
    drawWrapped(`Fecha de atención: ${record.invitation.appointmentDate}`, 10);
  }

  for (const [stepNumber, questions] of Object.entries(STEP_QUESTIONS)) {
    heading(FORM_STEPS[Number(stepNumber) - 1].title);
    for (const question of questions) {
      const answer = record.answers[question.id] === "yes" ? "Sí" : "No";
      drawWrapped(`${question.text} Respuesta: ${answer}`, 9, regular, 8);
    }
  }

  if (record.medicationDetails) {
    heading("Detalle de medicamentos o tratamientos");
    drawWrapped(record.medicationDetails, 9);
  }
  if (record.sensitivityDetails) {
    heading("Detalle de alergias o sensibilidades");
    drawWrapped(record.sensitivityDetails, 9);
  }

  heading(`Declaración y consentimiento (${record.consentVersion})`);
  drawWrapped(CONSENT_SUMMARY, 9);
  y -= 7;
  drawWrapped(`Aceptación electrónica registrada: ${record.acceptedAt}`, 9, bold);
  drawWrapped("La aceptación se registró al seleccionar expresamente el botón «Acepto».", 9);

  return document.save();
}
