export type YesNoAnswer = "yes" | "no";

export type Question = {
  id: string;
  text: string;
  group?: string;
};

export const FORM_STEPS = [
  { title: "Tu invitación", description: "Bienvenida a Lash by Katty. Estos son los datos del servicio preparado para ti." },
  { title: "Antecedentes generales", description: "Queremos conocerte un poquito más, esto nos ayuda a realizar un servicio seguro y personalizado para ti. ♡" },
  { title: "Medicamentos y antecedentes hormonales", description: "Responde según tu situación actual." },
  { title: "Ojos, párpados y sensibilidad", description: "Responde según tu situación actual y tus antecedentes." },
  { title: "Pestañas naturales y procedimientos anteriores", description: "Cuéntanos sobre tus pestañas y procedimientos recientes." },
  { title: "Declaración y consentimiento", description: "Lee este resumen y confirma tu aceptación antes de continuar." },
  { title: "Recomendaciones y confirmación", description: "Revisa tus respuestas antes de finalizar." },
] as const;

export const STEP_QUESTIONS: Record<number, Question[]> = {
  2: [
    { id: "period", text: "¿Estás en tu período menstrual o próxima a comenzarlo?" },
    { id: "alcohol", text: "¿Has consumido alcohol?" },
    { id: "energyDrinks", text: "¿Has consumido bebidas energéticas?" },
    { id: "caffeine", text: "¿Has consumido una cantidad elevada de café u otras fuentes de cafeína?" },
    { id: "recreationalSubstances", text: "¿Has consumido drogas o sustancias recreativas?" },
    { id: "respiratorySymptoms", text: "¿Estás resfriada, congestionada o presentas síntomas respiratorios leves?" },
    { id: "frequentCough", text: "¿Presentas tos frecuente que pueda dificultar permanecer acostada con los ojos cerrados?" },
    { id: "stressOrSleep", text: "¿Estás atravesando un período de estrés elevado, ansiedad o falta importante de sueño?" },
  ],
  3: [
    { id: "antibiotics", text: "¿Estás tomando antibióticos actualmente?" },
    { id: "regularMedication", text: "¿Utilizas medicamentos de forma habitual o te encuentras bajo algún tratamiento médico?" },
    { id: "eyeMedication", text: "¿Utilizas gotas oftálmicas o medicamentos/productos aplicados en la zona ocular?" },
    { id: "hormonalConditions", text: "¿Tienes antecedentes de alteraciones hormonales?" },
    { id: "thyroidConditions", text: "¿Tienes antecedentes de alteraciones de la tiroides?" },
    { id: "hormonalChanges", text: "¿Estás atravesando cambios hormonales importantes?" },
    { id: "pregnancyOrNursing", text: "¿Estás embarazada o en período de lactancia?" },
  ],
  4: [
    { id: "sensitiveEyes", text: "¿Tienes ojos especialmente sensibles?" },
    { id: "tearing", text: "¿Presentas lagrimeo frecuente o excesivo?" },
    { id: "oilySkin", text: "¿Tienes piel o párpados muy grasos?" },
    { id: "environmentalAllergies", text: "¿Sueles presentar alergias estacionales o ambientales, aunque actualmente no tengas una reacción activa?" },
    { id: "previousServiceSensitivity", text: "¿Has presentado anteriormente sensibilidad o molestias durante o después de un servicio de pestañas?" },
    { id: "eyeProducts", text: "¿Utilizas frecuentemente cremas, aceites, sérums u otros productos alrededor de los ojos?" },
  ],
  5: [
    { id: "weakLashes", text: "¿Tus pestañas naturales son finas, débiles o quebradizas?", group: "Antecedentes de las pestañas naturales" },
    { id: "lashFall", text: "¿Presentas una caída de pestañas mayor a la habitual?" },
    { id: "extensionRetention", text: "¿Has presentado anteriormente baja retención o caída prematura de extensiones?" },
    { id: "liftingDuration", text: "¿Has presentado anteriormente poca duración o pérdida temprana del efecto de un lifting?" },
    { id: "overprocessedLashes", text: "¿Has presentado pestañas resecas, quebradizas o sobreprocesadas después de un lifting?" },
    { id: "lashSerum", text: "¿Utilizas actualmente algún sérum u otro producto para estimular el crecimiento de las pestañas?" },
    { id: "recentLifting", text: "¿Te has realizado recientemente un lifting de pestañas?", group: "Procedimientos recientes" },
    { id: "recentExtensions", text: "¿Has utilizado extensiones de pestañas recientemente?" },
    { id: "recentTint", text: "¿Te has realizado recientemente un tinte de pestañas?" },
    { id: "recentEyeTreatment", text: "¿Te has realizado algún tratamiento facial o procedimiento cosmético cerca de la zona ocular?" },
  ],
};

export const MEDICATION_DETAIL_IDS = ["antibiotics", "regularMedication", "eyeMedication"];
export const SENSITIVITY_DETAIL_IDS = ["environmentalAllergies", "previousServiceSensitivity"];

export const CONSENT_VERSION = "2026-11-11-summary-v1";

export const CONSENT_SUMMARY =
  "Declaro que la información entregada es completa y verídica, y que he informado antecedentes relevantes. Comprendo que ciertas condiciones pueden influir en mi comodidad, la retención, duración o resultado del servicio, y que la profesional puede recomendar postergarlo, modificarlo o rechazarlo si considera que existe un riesgo para mis ojos, párpados o pestañas. Si la profesional determina que es seguro y decido continuar voluntariamente, entiendo que las variaciones atribuibles a antecedentes que informé no garantizan la repetición gratuita del servicio ni la devolución del dinero.";
