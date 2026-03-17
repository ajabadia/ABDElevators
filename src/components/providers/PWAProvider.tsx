"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface PWAContextType {
  isOffline: boolean;
  canInstall: boolean;
  install: () => void;
  syncData: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check online status
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Conexión restablecida", {
        description: "Los cambios locales se sincronizarán pronto.",
        icon: <Wifi className="w-4 h-4 text-emerald-500" />
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error("Modo sin conexión", {
        description: "Puedes seguir consultando manuales cacheados.",
        icon: <WifiOff className="w-4 h-4 text-rose-500" />
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    // Handle PWA Install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    });

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("SW registered:", reg))
          .catch((err) => console.log("SW registration failed:", err));
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const install = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === "accepted") {
          setCanInstall(false);
        }
      });
    }
  };

  const syncData = async () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Sincronizando datos de campo...",
        success: "Sincronización completada",
        error: "Error al sincronizar"
      }
    );
  };

  return (
    <PWAContext.Provider value={{ isOffline, canInstall, install, syncData }}>
      {children}
      {isOffline && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2">
          <div className="bg-rose-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30">
            <WifiOff className="w-3 h-3" />
            MODO OFFLINE ACTIVO
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) throw new Error("usePWA must be used within a PWAProvider");
  return context;
};
