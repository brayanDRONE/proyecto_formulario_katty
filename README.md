# Lash by Katty

Formulario de consentimiento con panel administrativo, enlaces personales,
Vercel Blob privado para solicitudes y PDF, funciones de Vercel y notificación
de correo mediante Resend.

## Desarrollo

```bash
npm install
npm run dev
```

## Desarrollo local

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Para probar funciones y Blob localmente, instala Vercel CLI, vincula el proyecto,
crea un store privado y descarga las variables de desarrollo con `vercel env pull`.
No compartas ni subas `.env`.

Genera un hash de contraseña administrativa desde una terminal interactiva:

```bash
npm run hash-admin-password
```

Copia la línea `ADMIN_PASSWORD_HASH=...` directamente a los secretos de Vercel
o a `.env` local. El script no muestra la contraseña ingresada.

## Arquitectura y privacidad

- Las solicitudes y respuestas se guardan como objetos JSON en un store privado
  de Vercel Blob. El PDF también queda en el store privado.
- Blob es almacenamiento de objetos, no una base de datos relacional: no ofrece
  consultas, transacciones ni índices. El panel lista los primeros 1.000 objetos.
  Esta decisión limita la búsqueda y el manejo concurrente; migrar a PostgreSQL
  antes de crecer o depender de una administración avanzada.
- Los tokens de invitación son aleatorios, no incluyen datos personales y se
  almacenan solo como hash. Los enlaces vencen después de siete días por defecto.
- El panel `/admin` usa contraseña configurada en el servidor y cookie firmada,
  HttpOnly, SameSite y Secure en producción.
- Los PDF solo se descargan desde una función autenticada. Resend envía el PDF
  como adjunto; el cuerpo del correo no contiene respuestas médicas.
- Las respuestas de la paciente se guardan al enviar. Si Resend falla o aún no
  está configurado, el registro y PDF permanecen guardados y el panel permite
  reintentar el correo.

El resumen del consentimiento está versionado y debe ser revisado y aprobado
por la profesional antes del uso real. Las respuestas contienen datos sensibles;
definir y documentar una política de retención y eliminación antes de producción.

## Configuración de Vercel y Resend

1. Importa este repositorio en Vercel y crea/conecta un **private Blob store**.
   Prefiere OIDC al conectar el store al proyecto.
2. Añade en Vercel Production (y Preview/Development cuando corresponda):
   `APP_BASE_URL`, `ADMIN_PASSWORD_HASH` (generado con el script),
   `SESSION_SECRET` (32 caracteres o más), `NOTIFICATION_EMAIL` (el correo de
   Katty),
   `RESEND_FROM_EMAIL`, y `RESEND_API_KEY`.
3. En Resend, revoca las claves que se hayan mostrado en capturas o compartido
   en chats, crea una nueva y guárdala solo en los secretos de Vercel. Verifica
   el dominio remitente y usa una dirección de ese dominio en `RESEND_FROM_EMAIL`.
   No uses una clave API en el navegador ni en GitHub.
4. Despliega y abre `/admin` para crear una solicitud. La paciente recibe un
   enlace privado con su nombre y servicio precargados.
5. Completa un formulario de prueba y revisa el consentimiento y PDF antes de
   habilitar el flujo para pacientes reales.

Variables de entorno de ejemplo: [.env.example](./.env.example).

## Verificación

```bash
npm run build
```
