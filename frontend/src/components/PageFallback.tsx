/**
 * Fallback ligero que se muestra mientras se descarga el chunk de cada ruta
 * (code-splitting con React.lazy + Suspense). Sin dependencias nuevas: solo un
 * spinner con utilidades de Tailwind y los tokens de color del tema.
 */
export function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Cargando">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  );
}
