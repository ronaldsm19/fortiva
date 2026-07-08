// Punto de entrada del backend para el preset "express" de Vercel (modo Services).
//
// Vercel detecta este archivo en la raíz del servicio `backend` y convierte la app
// Express en UNA sola Vercel Function (Fluid compute). El entrypoint debe EXPORTAR la
// app (`module.exports = app`) o usar `app.listen`.
//
// Cargamos el build compilado (`dist`, que produce el buildCommand con `tsc + tsc-alias`)
// en vez del código TypeScript fuente: así los alias `@/` ya están reescritos a rutas
// relativas y no dependemos de que el bundler de Vercel los resuelva.
const { createApp } = require('./dist/src/app.js');

module.exports = createApp();
