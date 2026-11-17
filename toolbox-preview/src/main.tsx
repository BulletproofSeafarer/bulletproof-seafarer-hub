/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource-variable/plus-jakarta-sans';
import './style.css';

createRoot(document.getElementById('root')!).render(<App />);
if (import.meta.env.PROD && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('./sw.js').catch(console.warn);
}
