
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// For local development, if you are not using a bundler that handles .env files (like Vite or Create React App),
// you might need to manually ensure `process.env.API_KEY` is available.
// One way (less secure for actual keys) is to set it on the window object in index.html,
// then polyfill `process.env` here if it's not defined.
if (typeof process === 'undefined') {
  // @ts-ignore
  window.process = { env: {} };
}
// @ts-ignore
if (window.APP_CONFIG && window.APP_CONFIG.API_KEY) {
    // @ts-ignore
  process.env.API_KEY = window.APP_CONFIG.API_KEY;
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
