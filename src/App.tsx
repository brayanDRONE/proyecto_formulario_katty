import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Info,
  PawPrint,
} from "lucide-react";
import MascotasHeader from "./components/MascotasHeader";
import {
  CONSENT_SUMMARY,
  CONSENT_VERSION,
  FORM_STEPS,
  MEDICATION_DETAIL_IDS,
  SENSITIVITY_DETAIL_IDS,
  STEP_QUESTIONS,
  type YesNoAnswer,
} from "./formData";
import Admin from "./pages/Admin";

type FormAnswers = {
  questions: Record<string, YesNoAnswer | undefined>;
  medicationDetails: string;
  sensitivityDetails: string;
  consentAccepted: boolean;
};

const DEMO_INVITATION = {
  id: "demo",
  firstName: "Camila",
  lastName: "Ejemplo",
  service: "Lifting de pestañas",
};

const invitationToken =
  window.location.pathname.match(/^\/consentimiento\/([\w-]+)\/?$/)?.[1] ?? null;

function App() {
  const [step, setStep] = useState(1);
  const [invitation, setInvitation] = useState<{
    id?: string;
    firstName: string;
    lastName: string;
    service: string;
    appointmentDate?: string | null;
  } | null>(invitationToken ? null : DEMO_INVITATION);
  const [token] = useState<string | null>(invitationToken);
  const [answers, setAnswers] = useState<FormAnswers>({
    questions: {},
    medicationDetails: "",
    sensitivityDetails: "",
    consentAccepted: false,
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invitationLoading, setInvitationLoading] = useState(Boolean(invitationToken));

  useEffect(() => {
    if (!invitationToken) return;
    let active = true;
    fetch(`/api/invitation?token=${encodeURIComponent(invitationToken)}`)
      .then(async (response) => {
        const result = await response.json() as {
          error?: string;
          invitation?: {
            firstName: string;
            lastName: string;
            service: string;
            appointmentDate: string | null;
          };
        };
        if (!response.ok || !result.invitation) {
          throw new Error(result.error ?? "El enlace no está disponible.");
        }
        if (active) setInvitation(result.invitation);
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "El enlace no está disponible.");
      })
      .finally(() => {
        if (active) setInvitationLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setQuestionAnswer = (id: string, value: YesNoAnswer) => {
    setAnswers((current) => {
      const next = {
        ...current,
        questions: { ...current.questions, [id]: value },
      };
      if (value === "no" && MEDICATION_DETAIL_IDS.includes(id)) {
        next.medicationDetails = "";
      }
      if (value === "no" && SENSITIVITY_DETAIL_IDS.includes(id)) {
        next.sensitivityDetails = "";
      }
      return next;
    });
    setMessage("");
  };

  const stepQuestions = STEP_QUESTIONS[step] ?? [];
  const medicationDetailsRequired =
    step === 3 && MEDICATION_DETAIL_IDS.some((id) => answers.questions[id] === "yes");
  const sensitivityDetailsRequired =
    step === 4 && SENSITIVITY_DETAIL_IDS.some((id) => answers.questions[id] === "yes");

  const submitForm = async () => {
    if (!token) {
      setMessage("Esta demostración no envía ni guarda tus respuestas.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answers: answers.questions,
          medicationDetails: answers.medicationDetails,
          sensitivityDetails: answers.sensitivityDetails,
          consentAccepted: answers.consentAccepted,
          consentVersion: CONSENT_VERSION,
        }),
      });
      const result = await response.json() as { error?: string; emailStatus?: string };
      if (!response.ok) {
        setMessage(result.error ?? "No se pudo completar el envío. Inténtalo nuevamente.");
        return;
      }

      setMessage(
        result.emailStatus === "sent"
          ? "Formulario recibido. El PDF fue enviado a la profesional."
          : "Formulario recibido. La notificación por correo está pendiente; tus respuestas quedaron registradas.",
      );
    } catch {
      setMessage("No se pudo conectar con el servidor. Inténtalo nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

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

    if (step < FORM_STEPS.length) {
      setStep((current) => current + 1);
      setMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setMessage("Esta demostración no envía ni guarda tus respuestas.");
  };

  const progress = (step / FORM_STEPS.length) * 100;

  if (window.location.pathname === "/admin" || window.location.pathname === "/admin/") {
    return <Admin />;
  }

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
          <div className="step-count">Paso {step} de {FORM_STEPS.length}</div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Progreso del formulario"
            aria-valuemin={1}
            aria-valuemax={FORM_STEPS.length}
            aria-valuenow={step}
          >
            <span className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <h1 className="section-title">
            <svg className="lash-mark" viewBox="0 0 64 32" aria-hidden="true">
              <path d="M5 6c15 19 39 19 54 0" />
              <path d="m12 11-7 6m15-2-5 9m15-7-2 11m12-11 2 11m7-13 5 9m2-13 7 6" />
            </svg>
            {FORM_STEPS[step - 1].title}
          </h1>

          <p className="intro-message">{FORM_STEPS[step - 1].description}</p>

          {invitationLoading && <p className="demo-hint">Verificando tu invitación…</p>}
          {!invitationLoading && !invitation && (
            <p className="pending-content" role="alert">
              {message || "El enlace no es válido o ya no está disponible."}
            </p>
          )}

          {step === 1 && invitation && (
            <div className="invitation-card">
              <p className="invitation-greeting">¡Hola, {invitation.firstName}!</p>
              <p className="invitation-welcome">
                Antes de comenzar, queremos conocer algunos antecedentes
                importantes para preparar tu atención.
              </p>
              <div className="invitation-service">
                <span>Servicio preparado para ti</span>
                <strong>{invitation.service}</strong>
              </div>
              <p className="demo-hint">
                En esta demostración se muestran datos de ejemplo. En la versión
                conectada, tu invitación cargará los datos registrados por Katty.
              </p>
            </div>
          )}

          {step === 2 && invitation && (
            <p className="reference-note">
              Referencia temporal: situación actual o durante las últimas 24 horas.
            </p>
          )}

          {stepQuestions.length > 0 && invitation && (
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

          {medicationDetailsRequired && invitation && (
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

          {sensitivityDetailsRequired && invitation && (
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

          {step === 6 && invitation && (
            <div className="consent-outline">
              <p className="consent-summary">
                {CONSENT_SUMMARY}
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

          {step === 7 && invitation && (
            <div className="review-summary">
              <h2>Datos de la invitación</h2>
              <dl>
                <div>
                  <dt>Nombre</dt>
                  <dd>{invitation.firstName} {invitation.lastName}</dd>
                </div>
                <div>
                  <dt>Servicio</dt>
                  <dd>{invitation.service}</dd>
                </div>
              </dl>
              {Object.entries(STEP_QUESTIONS).map(([questionStep, questions]) => (
                <section className="review-section" key={questionStep}>
                  <h3>                  {FORM_STEPS[Number(questionStep) - 1].title}</h3>
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
              disabled={submitting || invitationLoading || !invitation}
              onClick={step === FORM_STEPS.length ? submitForm : continueStep}
            >
              {submitting ? "Enviando…" : step === FORM_STEPS.length ? "Finalizar" : "Continuar"}
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
