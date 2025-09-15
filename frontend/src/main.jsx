import React from "react";
import ReactDOM from "react-dom/client";
import AppWrapper from "./AppWrapper.jsx";
import "./index.css";
import "./styles/chrome-theme.css";
import "./utils/consoleCleaner.js";
import clearAllCache from "./utils/clearAllCache.js";

// Make cache clearing available globally
window.clearAllCache = clearAllCache;

// Disable service worker for now - it's causing CORS issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

// Mount the app with our error boundary wrapper
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
