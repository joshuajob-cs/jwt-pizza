/**
 * @fileoverview Browser entry point: mounts the React app into index.html's `<div id="root">`.
 *
 * `<BrowserRouter>` wraps the whole app so every component can use react-router (routes, navigate,
 * location). index.html loads this file with `<script type="module" src="/index.tsx">`, and Vite compiles
 * the TypeScript on the fly.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './src/app/app';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
} else {
  console.error('No root element found');
}
