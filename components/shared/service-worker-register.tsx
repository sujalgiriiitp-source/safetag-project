"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
      if ("caches" in window) {
        caches.keys().then((cacheKeys) => {
          cacheKeys.forEach((key) => {
            caches.delete(key);
          });
        });
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.update();
      })
      .catch((error) => {
        console.error("Service worker registration failed", error);
      });
  }, []);

  return null;
}
