import React from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders } from './app/providers/AppProviders.jsx';

const rootElement = document.getElementById('react-root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AppProviders />
    </React.StrictMode>,
  );
}
