/**
 * GeoSnap — App (Fase 5).
 *
 * Componente radice: avvia direttamente il gioco senza onboarding (RF-01, RF-49).
 * Il flusso completo (GameScreen → SummaryScreen → Gioca ancora) è gestito
 * internamente da GameScreen.
 */
import { GameScreen } from './GameScreen';

export function App() {
  return <GameScreen />;
}

export default App;
