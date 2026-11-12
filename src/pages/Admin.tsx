import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Copy, ExternalLink, LogOut } from "lucide-react";

type Invitation = {
  expiresAt: string;
};

type ApiResult<T> = T & { error?: string };

async function requestJson<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = await response.json() as ApiResult<T>;
  if (!response.ok) throw new Error(result.error ?? "No se pudo completar la solicitud.");
  return result;
}

function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newLinkGreeting, setNewLinkGreeting] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    rut: "",
    service: "",
    appointmentDate: "",
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      await requestJson("/api/admin/invitations");
      setAuthenticated(true);
    } catch (error) {
      if (error instanceof Error && error.message === "Inicia sesión para continuar.") {
        setAuthenticated(false);
      } else {
        setMessage(error instanceof Error ? error.message : "No se pudo cargar el panel.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    try {
      await requestJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    }
  };

  const createInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setNewLink("");
    try {
      const result = await requestJson<{ link: string; invitation: Invitation }>(
        "/api/admin/invitations",
        { method: "POST", body: JSON.stringify(form) },
      );
      setNewLink(result.link);
      setNewLinkGreeting(`${form.firstName} ${form.lastName}`.trim());
      setMessage(`Enlace creado. Vence el ${new Date(result.invitation.expiresAt).toLocaleString("es-CL")}.`);
      setForm({
        firstName: "",
        lastName: "",
        rut: "",
        service: "",
        appointmentDate: "",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el enlace.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(newLink);
      setMessage("Enlace copiado.");
    } catch {
      setMessage("No se pudo copiar el enlace. Selecciónalo y cópialo manualmente.");
    }
  };

  const logout = async () => {
    try {
      await requestJson("/api/admin/logout", { method: "POST", body: "{}" });
      setAuthenticated(false);
      setNewLink("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cerrar sesión.");
    }
  };

  return (
    <main className="page-shell admin-page">
      <header className="brand-header">
        <img
          className="brand-seal"
          src="/marca/sello-lash-by-katty.png"
          alt="Lash by Katty"
        />
      </header>
      <section className="admin-card">
        <h1 className="admin-title">Panel de Lash by Katty</h1>
        {!authenticated ? (
          <form className="admin-login" onSubmit={login}>
            <p>Ingresa con la contraseña administrativa configurada para el sistema.</p>
            <label htmlFor="admin-password">Contraseña</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button className="admin-primary-button" type="submit">Iniciar sesión</button>
          </form>
        ) : (
          <>
            <div className="admin-toolbar">
              <span>Genera un enlace personalizado para cada clienta.</span>
              <button className="admin-quiet-button" type="button" onClick={() => void logout()}>
                <LogOut aria-hidden="true" /> Cerrar sesión
              </button>
            </div>

            <section className="admin-section">
              <h2>Nueva solicitud</h2>
              <form className="admin-request-form" onSubmit={createInvitation}>
                <label>
                  Nombre
                  <input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
                </label>
                <label>
                  Apellido
                  <input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
                </label>
                <label>
                  RUT (opcional)
                  <input value={form.rut} onChange={(event) => setForm({ ...form, rut: event.target.value })} />
                </label>
                <label>
                  Servicio
                  <select required value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}>
                    <option value="">Selecciona un servicio</option>
                    <option value="Lifting de pestañas">Lifting de pestañas</option>
                    <option value="Extensiones de pestañas">Extensiones de pestañas</option>
                  </select>
                </label>
                <label>
                  Fecha de atención (opcional)
                  <input type="date" value={form.appointmentDate} onChange={(event) => setForm({ ...form, appointmentDate: event.target.value })} />
                </label>
                <button className="admin-primary-button" type="submit">Generar enlace de consentimiento</button>
              </form>
              {newLink && (
                <div className="admin-generated-link">
                  <label htmlFor="generated-link">Enlace personalizado</label>
                  <input id="generated-link" readOnly value={newLink} onFocus={(event) => event.target.select()} />
                  <div className="admin-link-actions">
                    <button className="admin-quiet-button" type="button" onClick={() => void copyLink()}>
                      <Copy aria-hidden="true" /> Copiar enlace
                    </button>
                    <a
                      className="admin-quiet-button"
                      href={`https://wa.me/?text=${encodeURIComponent(`Hola ${newLinkGreeting}! Completa tu formulario de Lash by Katty: ${newLink}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink aria-hidden="true" /> Compartir por WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </section>

          </>
        )}
        {loading && <p className="admin-status">Cargando panel…</p>}
        <p className="admin-status" role="status" aria-live="polite">{message}</p>
        <p className="admin-warning">
          Los consentimientos contienen antecedentes sensibles. Usa una contraseña
          robusta y configura todos los secretos en Vercel; no los compartas en GitHub.
        </p>
      </section>
    </main>
  );
}

export default Admin;
