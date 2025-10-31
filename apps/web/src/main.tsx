import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import Providers from './providers/index.tsx';

import './globals.css';
import RouterProvider from './providers/router/index.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider />
    </Providers>
  </StrictMode>
);
