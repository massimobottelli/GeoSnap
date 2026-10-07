import { defineConfig } from 'vitest/config';

// Configurazione dei test unitari (Vitest) per la logica pura in `src/game/**`
// e `src/**`. Ambiente `node`: i test di gioco non richiedono il DOM.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
});
