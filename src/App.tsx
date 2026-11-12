import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Info,
  PawPrint,
} from "lucide-react";
import MascotasHeader from "./components/MascotasHeader";

type YesNoAnswer = "yes" | "no";
type Question = { id: string; text: string; group?: string };

type FormAnswers = {
  questions: Record<string, YesNoAnswer | undefined>;
  medicationDetails: string;
  sensitivityDetails: string;
  consentAccepted: boolean;
};

const DEMO_INVITATION = {
  firstName: "Camila",
  lastName: "Ejemplo",
  service: "Lifting de pestañas",
};

const STEPS = [
  { title: "Tu invitación", description: "Bienvenida a Lash by Katty. Estos son los datos del servicio preparado para ti." },
  { title: "Antecedentes generales", description: "Queremos conocerte un poquito más, esto nos ayuda a realizar un servicio seguro y personalizado para ti. ♡" },
  { title: "Medicamentos y antecedentes hormonales", description: "Responde según tu situación actual." },
  { title: "Ojos, párpados y sensibilidad", description: "Responde según tu situación actual y tus antecedentes." },
  { title: "Pestañas naturales y procedimientos anteriores", description: "Cuéntanos sobre tus pestañas y procedimientos recientes." },
  { title: "Declaración y consentimiento", description: "Lee este resumen y confirma tu aceptación antes de continuar." },
  { title: "Recomendaciones y confirmación", description: "Revisa tus respuestas antes de finalizar." },
] as const;

const STEP_QUESTIONS: Record<number, Question[]> = {
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

const MEDICATION_IDS = ["antibiotics", "regularMedication", "eyeMedication"];
const SENSITIVITY_IDS = ["environmentalAllergies", "previousServiceSensitivity"];

function App() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<FormAnswers>({
    questions: {},
    medicationDetails: "",
    sensitivityDetails: "",
    consentAccepted: false,
  });
  const [message, setMessage] = useState("");

  const setQuestionAnswer = (id: string, value: YesNoAnswer) => {
    setAnswers((current) => ({
      ...current,
      questions: { ...current.questions, [id]: value },
    }));
    setMessage("");
  };

  const stepQuestions = STEP_QUESTIONS[step] ?? [];
  const medicationDetailsRequired =
    step === 3 && MEDICATION_IDS.some((id) => answers.questions[id] === "yes");
  const sensitivityDetailsRequired =
    step === 4 && SENSITIVITY_IDS.some((id) => answers.questions[id] === "yes");

  const goBack = () => {
    setStep((current) => Math.max(1, current - 1));
    setMessage("");
  };

  const continueStep = () => {
    if (stepQuestions.some((question) => !answers.questions[question.id])) {
      setMessage("Responde Sí o No a todas las preguntas obligatorias para continuar.");
      return;
    }

    if (medicationDetailsRequired && !answers.medicationDetails.trim()) {
      setMessage("Indica qué medicamentos o tratamientos utilizas actualmente.");
      return;
    }

    if (sensitivityDetailsRequired && !answers.sensitivityDetails.trim()) {
      setMessage("Detalla las alergias o sensibilidades conocidas.");
      return;
    }

    if (step === 6 && !answers.consentAccepted) {
      setMessage("Debes seleccionar «Acepto» para continuar.");
      return;
    }

    if (step < STEPS.length) {
      setStep((current) => current + 1);
      setMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setMessage("Esta demostración no envía ni guarda tus respuestas.");
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <main className="page-shell">
      <div className="ambient ambient--left" aria-hidden="true" />
      <div className="ambient ambient--right" aria-hidden="true" />
      <span className="sparkle sparkle--one" aria-hidden="true">✦</span>
      <span className="sparkle sparkle--two" aria-hidden="true">✧</span>
      <span className="sparkle sparkle--three" aria-hidden="true">✦</span>
      <span className="speech-heart" aria-hidden="true"><Heart /></span>
      <span className="crown" aria-hidden="true">♛</span>

      <header className="brand-header">
        <img
          className="brand-seal"
          src="/marca/sello-lash-by-katty.png"
          alt="Lash by Katty, realzo tu mirada, resalto tu esencia"
          fetchPriority="high"
        />
      </header>

      <section className="form-stage" aria-label="Formulario de antecedentes">
        <MascotasHeader />

        <div className="form-card">
          <div className="step-count">Paso {step} de {STEPS.length}</div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Progreso del formulario"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step}
          >
            <span className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <h1 className="section-title">
            <svg className="lash-mark" viewBox="0 0 64 32" aria-hidden="true">
              <path d="M5 6c15 19 39 19 54 0" />
              <path d="m12 11-7 6m15-2-5 9m15-7-2 11m12-11 2 11m7-13 5 9m2-13 7 6" />
            </svg>
            {STEPS[step - 1].title}
          </h1>

          <p className="intro-message">{STEPS[step - 1].description}</p>

          {step === 1 && (
            <div className="invitation-card">
              <p className="invitation-greeting">¡Hola, {DEMO_INVITATION.firstName}!</p>
              <p className="invitation-welcome">
                Antes de comenzar, queremos conocer algunos antecedentes
                importantes para preparar tu atención.
              </p>
              <div className="invitation-service">
                <span>Servicio preparado para ti</span>
                <strong>{DEMO_INVITATION.service}</strong>
              </div>
              <p className="demo-hint">
                En esta demostración se muestran datos de ejemplo. En la versión
                conectada, tu invitación cargará los datos registrados por Katty.
              </p>
            </div>
          )}

          {step === 2 && (
            <p className="reference-note">
              Referencia temporal: situación actual o durante las últimas 24 horas.
            </p>
          )}

          {stepQuestions.length > 0 && (
            <div className="question-list">
              {stepQuestions.map((question, index) => {
                const previousQuestion = stepQuestions[index - 1];
                const showGroup = question.group && question.group !== previousQuestion?.group;

                return (
                  <div className="question-item" key={question.id}>
                    {showGroup && <h2 className="question-group-title">{question.group}</h2>}
                    <fieldset className="question">
                      <legend>
                        <span className="question-number">{index + 1}.</span>
                        {question.text}
                        {step === 2 && question.id === "period" && (
                          <span className="info-icon" title="Esta información nos ayuda a personalizar tu atención.">
                            <Info aria-hidden="true" />
                            <span className="sr-only">
                              Esta información nos ayuda a personalizar tu atención.
                            </span>
                          </span>
                        )}
                      </legend>
                      <div className="answer-options">
                        {(["yes", "no"] as const).map((value) => (
                          <button
                            type="button"
                            className={`answer-option${answers.questions[question.id] === value ? " is-selected" : ""}`}
                            aria-pressed={answers.questions[question.id] === value}
                            key={value}
                            onClick={() => setQuestionAnswer(question.id, value)}
                          >
                            <span className="radio-indicator" aria-hidden="true" />
                            {value === "yes" ? "Sí" : "No"}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                );
              })}
            </div>
          )}

          {medicationDetailsRequired && (
            <div className="conditional-field">
              <label htmlFor="medication-details">
                ¿Qué medicamentos o tratamientos utilizas actualmente?
              </label>
              <textarea
                id="medication-details"
                value={answers.medicationDetails}
                onChange={(event) => {
                  setAnswers((current) => ({ ...current, medicationDetails: event.target.value }));
                  setMessage("");
                }}
                rows={3}
                required
              />
            </div>
          )}

          {sensitivityDetailsRequired && (
            <div className="conditional-field">
              <label htmlFor="sensitivity-details">
                Detalla las alergias o sensibilidades conocidas.
              </label>
              <textarea
                id="sensitivity-details"
                value={answers.sensitivityDetails}
                onChange={(event) => {
                  setAnswers((current) => ({ ...current, sensitivityDetails: event.target.value }));
                  setMessage("");
                }}
                rows={3}
                required
              />
            </div>
          )}

          {step === 6 && (
            <div className="consent-outline">
              <p className="consent-summary">
                Declaro que la información entregada es completa y verídica, y que
                he informado antecedentes relevantes. Comprendo que ciertas
                condiciones pueden influir en mi comodidad, la retención, duración
                o resultado del servicio, y que la profesional puede recomendar
                postergarlo, modificarlo o rechazarlo si considera que existe un
                riesgo para mis ojos, párpados o pestañas. Si la profesional
                determina que es seguro y decido continuar voluntariamente,
                entiendo que las variaciones atribuibles a antecedentes que
                informé no garantizan la repetición gratuita del servicio ni la
                devolución del dinero.
              </p>
              <button
                type="button"
                className={`consent-accept${answers.consentAccepted ? " is-selected" : ""}`}
                aria-pressed={answers.consentAccepted}
                onClick={() => {
                  setAnswers((current) => ({ ...current, consentAccepted: !current.consentAccepted }));
                  setMessage("");
                }}
              >
                <span className="consent-checkbox" aria-hidden="true">
                  {answers.consentAccepted ? "✓" : ""}
                </span>
                Acepto
              </button>
            </div>
          )}

          {step === 7 && (
            <div className="review-summary">
              <h2>Datos de la invitación</h2>
              <dl>
                <div>
                  <dt>Nombre</dt>
                  <dd>{DEMO_INVITATION.firstName} {DEMO_INVITATION.lastName}</dd>
                </div>
                <div>
                  <dt>Servicio</dt>
                  <dd>{DEMO_INVITATION.service}</dd>
                </div>
              </dl>
              {Object.entries(STEP_QUESTIONS).map(([questionStep, questions]) => (
                <section className="review-section" key={questionStep}>
                  <h3>{STEPS[Number(questionStep) - 1].title}</h3>
                  <dl>
                    {questions.map((question) => (
                      <div key={question.id}>
                        <dt>{question.text}</dt>
                        <dd>
                          {answers.questions[question.id] === "yes"
                            ? "Sí"
                            : answers.questions[question.id] === "no" ? "No" : "Sin responder"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              {answers.medicationDetails && (
                <p className="review-detail">
                  <strong>Medicamentos o tratamientos:</strong> {answers.medicationDetails}
                </p>
              )}
              {answers.sensitivityDetails && (
                <p className="review-detail">
                  <strong>Alergias o sensibilidades:</strong> {answers.sensitivityDetails}
                </p>
              )}
              <p className="demo-hint">
                Tus respuestas se conservan solo mientras esta página está abierta.
                Esta demostración no las guarda ni las envía.
              </p>
            </div>
          )}

          <div className="heart-divider" aria-hidden="true">
            <span />
            <Heart />
            <span />
          </div>

          <nav className="form-navigation" aria-label="Navegación del formulario">
            <button
              className="navigation-button navigation-button--back"
              type="button"
              disabled={step === 1}
              onClick={goBack}
            >
              <ArrowLeft aria-hidden="true" />
              Anterior
            </button>
            <button
              className="navigation-button navigation-button--continue"
              type="button"
              onClick={continueStep}
            >
              {step === STEPS.length ? "Finalizar" : "Continuar"}
              <ArrowRight aria-hidden="true" />
            </button>
          </nav>
          <p className="demo-message" role="status" aria-live="polite">{message}</p>
          <div className="paw-decoration" aria-hidden="true">
            <PawPrint />
            <PawPrint />
            <PawPrint />
          </div>
        </div>
      </section>
      <p className="demo-caption">Demostración visual · tus respuestas no se guardan ni se envían</p>
    </main>
  );
}

export default App;
