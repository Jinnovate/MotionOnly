import React from "react";
import { createRoot } from "react-dom/client";
import App from "../app/page.jsx";
import "../app/globals.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
    .catch(() => undefined);
}

if ("caches" in window) {
  caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith("motion-only")).map((key) => caches.delete(key))))
    .catch(() => undefined);
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
