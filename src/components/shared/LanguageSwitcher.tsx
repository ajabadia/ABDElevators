"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Evitar errores de hidratación esperando a que el componente se monte
    useEffect(() => {
        setMounted(true);
    }, []);

    const setLocale = (newLocale: string) => {
        // Establecer la cookie NEXT_LOCALE para next-intl
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

        // Recargar la página para aplicar el nuevo idioma
        router.refresh();
    };

    const languages = [
        { code: "es", label: "Español", flag: "🇪🇸" },
        { code: "en", label: "English", flag: "🇺🇸" },
    ];

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="w-9 h-9 px-0" aria-label="Cambiar idioma">
                <Languages className="h-[1.2rem] w-[1.2rem]" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 px-0" aria-label="Cambiar idioma">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Cambiar idioma</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLocale(lang.code)}
                        className={locale === lang.code ? "bg-muted font-bold" : ""}
                    >
                        <span className="mr-2 text-lg">{lang.flag}</span>
                        {lang.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
