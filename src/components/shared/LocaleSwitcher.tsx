"use client";

import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useState, useEffect } from 'react';

export function LocaleSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSwitch = (newLocale: string) => {
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
        router.refresh();
    };

    if (!mounted) {
        return (
            <Button variant="ghost" className="h-9 w-9 p-0 text-slate-400">
                <Globe size={18} />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-white/5">
                    <Globe size={18} />
                    <span className="sr-only">Cambiar idioma</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-slate-300">
                <DropdownMenuItem
                    onClick={() => handleSwitch('es')}
                    className={locale === 'es' ? 'bg-teal-600/20 text-teal-400 font-bold' : ''}
                >
                    Español (ES)
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleSwitch('en')}
                    className={locale === 'en' ? 'bg-teal-600/20 text-teal-400 font-bold' : ''}
                >
                    English (EN)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
