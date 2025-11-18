import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import Providers from './providers';

import './globals.css';
import RouterProvider from './providers/router';

import '~build/console';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider />
    </Providers>
  </StrictMode>
);
