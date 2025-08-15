import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppPro } from './AppPro';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AppPro />
  </React.StrictMode>
);