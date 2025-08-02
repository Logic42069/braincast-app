import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Entry point for the Braincast application. This file mounts
// the React application onto the DOM. Vite's development server
// will inject the necessary scripts and stylesheets automatically.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
