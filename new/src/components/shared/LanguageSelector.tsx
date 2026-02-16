"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Languages, Check, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const languages = [
    { code: "es", label: "Español", flag: "🇪🇸", native: "Castellano" },
    { code: "en", label: "English", flag: "🇺🇸", native: "Global" },
];

export function LanguageSelector() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLocaleChange = (newLocale: string) => {
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        router.refresh();
    };

    const currentLanguage = languages.find((l) => l.code === locale) || languages[0];

    if (!mounted) {
        return (
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 md:w-auto md:px-3 gap-2">
                <Languages className="h-4 w-4" />
                <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">...</span>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 md:w-auto md:px-3 gap-2 hover:bg-teal-500/10 hover:text-teal-500 transition-all rounded-xl border border-transparent hover:border-teal-500/20"
                >
                    <Languages className="h-4 w-4" />
                    <span className="hidden md:inline text-xs font-black uppercase tracking-widest leading-none">
                        {currentLanguage.code}
                    </span>
                    <Globe className="h-3 w-3 opacity-20 hidden md:block" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border/50 backdrop-blur-xl bg-background/95 shadow-2xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 py-1.5">
                    Seleccionar Idioma
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="opacity-50" />
                <div className="space-y-1 mt-1">
                    {languages.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => handleLocaleChange(lang.code)}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                                locale === lang.code
                                    ? "bg-teal-500/10 text-teal-500 font-bold"
                                    : "hover:bg-muted"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl leading-none grayscale-[0.5] group-hover:grayscale-0">{lang.flag}</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">{lang.label}</span>
                                    <span className="text-[10px] opacity-50 font-medium">{lang.native}</span>
                                </div>
                            </div>
                            {locale === lang.code && <Check className="h-4 w-4" />}
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
