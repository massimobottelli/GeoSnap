/**
 * GeoSnap — Entry point (Fase 5).
 *
 * Monta l'app React e registra il service worker in produzione
 * per garantire il funzionamento offline e l'installabilità PWA.
 *
 * Riferimento: §12.1 dei Requisiti Tecnici MVP1.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './components/App';
import './styles/theme.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Elemento #root non trovato nel documento.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registra il service worker solo in produzione (non in dev, dove interferisce con HMR).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const base = import.meta.env.BASE_URL;
  const swUrl = `${base}sw.js`;
  void navigator.serviceWorker.register(swUrl, { scope: base }).catch((err: unknown) => {
    console.warn('[GeoSnap] Service worker registration failed:', err);
  });
}
