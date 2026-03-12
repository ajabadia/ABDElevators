"use client";

import React, { useEffect } from "react";
import { toast } from "sonner";

export function PWAProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            window.location.protocol === "https:" || 
            window.location.hostname === "localhost"
        ) {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((registration) => {
                        console.log("SW registered:", registration);
                    })
                    .catch((error) => {
                        console.error("SW registration failed:", error);
                    });
            });
        }
    }, []);

    return <>{children}</>;
}
