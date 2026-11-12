# Lash by Katty

Demostración visual del formulario de consentimiento en React, Vite y TypeScript.

## Desarrollo

```bash
npm install
npm run dev
```

La aplicación presenta siete etapas. La primera muestra una invitación
personalizada de ejemplo; la paciente no debe ingresar su nombre ni elegir el
servicio. En la versión conectada, esos datos deberán cargarse desde la solicitud
creada por Katty. Las respuestas se mantienen solamente en memoria mientras la
página está abierta; no se guardan ni se envían.

## Formulario de demostración

Las etapas 2 a 5 incluyen las preguntas recibidas y exigen una respuesta Sí/No.
Los campos de detalle de tratamientos y sensibilidades aparecen cuando
corresponde. La etapa 6 presenta un resumen del consentimiento entregado y
requiere una aceptación expresa para continuar.

El nombre y servicio de la primera etapa son datos ficticios de demostración;
deben obtenerse de la invitación generada por Katty en una futura fase. Las
respuestas se conservan solo en memoria mientras la página está abierta; no se
guardan ni se envían. El texto resumido del consentimiento debe ser revisado y
aprobado por la profesional antes de utilizarlo en producción.

## Verificación

```bash
npm run build
```
