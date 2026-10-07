/**
 * App — guscio dell'applicazione (Fase 0).
 *
 * In Fase 0 questo componente rende solo la shell vuota dell'applicazione.
 * Il flusso di gioco reale (GameScreen, mappa, vassoio, HUD) verrà introdotto
 * nelle fasi successive. Nessuna logica di gioco vive qui.
 */
export function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-map-bg px-6 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight text-accent">GeoSnap</h1>
      <p className="max-w-sm text-sm text-slate-500">
        Scheletro dell&apos;applicazione — Fase 0 (setup e infrastruttura).
      </p>
    </main>
  );
}

export default App;
