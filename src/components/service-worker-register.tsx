"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/register";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}