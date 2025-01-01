// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot correctly
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome

const container = document.getElementById('root');

// Ensure the container exists
if (container) {
  const root = createRoot(container); // Create a root.
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root container not found");
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
