# Lash by Katty

Formulario de consentimiento con panel administrativo, enlaces personales
firmados y envío del PDF por correo mediante Resend. No usa base de datos ni
almacenamiento: no se guarda ninguna respuesta en el servidor.

## Desarrollo local

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Las funciones `/api` no corren bajo `npm run dev`. Para probarlas localmente
usa Vercel CLI (`vercel dev`). No compartas ni subas `.env`.

Genera un hash de contraseña administrativa desde una terminal interactiva:

```bash
npm run hash-admin-password
```

Copia la línea `ADMIN_PASSWORD_HASH=...` a los secretos de Vercel o a `.env`.

## Cómo funciona

1. Katty entra a `/admin`, escribe el nombre de la clienta y el servicio, y
   genera un enlace personalizado.
2. El enlace contiene los datos firmados con `SESSION_SECRET`; no se guardan en
   ningún lugar y vence a los 7 días (configurable con `INVITATION_TTL_DAYS`).
3. La clienta solo responde las preguntas. Al enviar, el servidor valida las
   respuestas, genera el PDF en memoria y lo envía a Katty con Resend.

## Privacidad y límites

- Las respuestas no se almacenan: solo existen en el PDF enviado por correo.
  Si Resend falla, la clienta ve un error y debe reintentar; no se pierde nada
  del lado de Katty porque no se recibió nada.
- El enlace firmado no se puede alterar, pero tampoco se puede marcar como
  usado: puede completarse más de una vez hasta que venza.
- El panel `/admin` usa contraseña configurada en el servidor y cookie firmada,
  HttpOnly, SameSite y Secure en producción.
- El cuerpo del correo no contiene respuestas médicas; van solo en el PDF.

El resumen del consentimiento está versionado y debe ser revisado y aprobado
por la profesional antes del uso real.

## Configuración de Vercel y Resend

1. Importa este repositorio en Vercel.
2. Añade en Vercel (Production y, si corresponde, Preview):
   `APP_BASE_URL` (URL del despliegue), `ADMIN_PASSWORD_HASH`,
   `SESSION_SECRET` (32 caracteres o más), `NOTIFICATION_EMAIL` (correo de
   Katty), `RESEND_FROM_EMAIL` y `RESEND_API_KEY`.
3. En Resend, crea una clave nueva y guárdala solo en los secretos de Vercel.
   Verifica el dominio remitente y úsalo en `RESEND_FROM_EMAIL`; con
   `onboarding@resend.dev` solo se puede enviar al correo dueño de la cuenta.
4. Vuelve a desplegar, abre `/admin`, genera un enlace y completa una prueba.

Variables de ejemplo: [.env.example](./.env.example).

## Verificación

```bash
npm run build
```
