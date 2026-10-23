import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ErrorBoundary from "./ErrorBoundary";

// Global error handler - IGNORE "[Script error.]" from cross-origin scripts
// This is normal browser behavior for scripts from different origins (like Google's)
window.addEventListener('error', (event) => {
  const message = event.message || '';
  
  // Ignore cross-origin script errors - they're NOT real failures
  if (message === 'Script error.' || message === '[Script error.]' || !message) {
    // This is just CORS noise, not a real error
    return;
  }
  
  // Log real errors
  console.error('Global error:', message, event.filename);
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason?.message || String(reason);
  
  // Ignore cross-origin script errors
  if (message === 'Script error.' || message === '[Script error.]') {
    event.preventDefault();
    return;
  }
  
  console.error('Unhandled promise rejection:', message);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
