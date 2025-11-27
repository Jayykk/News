import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter } from 'react-router-dom';
import App from './App.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark" withCssVariables withGlobalStyles>
      <Notifications />
      <BrowserRouter basename="/app">
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);
