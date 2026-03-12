"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";
import { useNavigation } from "@/hooks/use-navigation";
import { getAppByPath } from "@/lib/app-registry";
import { useTranslations } from "next-intl";
import { MenuItem } from "@/config/navigation";

export interface CommandItem extends Omit<MenuItem, 'action'> {
    action?: () => void;
}

export interface CommandGroup {
    label: string;
    appId: string;
    items: CommandItem[];
}

/**
 * useCommandMenu — ERA 14 Refactor
 * Encapsulates the logic for the Command Menu (palette).
 * Handles searching, sorting, keyboard navigation, and themes.
 */
export function useCommandMenu() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const { setTheme } = useTheme();
    const navigationGroups = useNavigation();
    const t = useTranslations("common");

    // Detect current path
    const pathname = typeof window !== 'undefined' ? window.location.pathname : "";

    // Global shortcut Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = useCallback((command: () => void) => {
        setOpen(false);
        setQuery("");
        setSelectedIndex(0);
        command();
    }, []);

    const handleItemExecute = useCallback((item: CommandItem) => {
        if (item.action) {
            runCommand(item.action);
        } else if (item.href) {
            runCommand(() => router.push(item.href));
        }
    }, [router, runCommand]);

    // Themes / System commands
    const systemGroup = useMemo(() => ({
        label: t("command_menu.system"),
        appId: 'SYSTEM',
        items: [
            {
                name: t("command_menu.themes.light"),
                nameKey: "command_menu.themes.light",
                icon: Sun,
                href: "#",
                action: () => setTheme("light")
            },
            {
                name: t("command_menu.themes.dark"),
                nameKey: "command_menu.themes.dark",
                icon: Moon,
                href: "#",
                action: () => setTheme("dark")
            },
            {
                name: t("command_menu.themes.system"),
                nameKey: "command_menu.themes.system",
                icon: Laptop,
                href: "#",
                action: () => setTheme("system")
            }
        ] as CommandItem[]
    }), [t, setTheme]);

    // Sort groups by context
    const sortedGroups = useMemo(() => {
        const activeApp = getAppByPath(pathname || '/');

        return [...navigationGroups].sort((a, b) => {
            if (activeApp) {
                if (a.appId === activeApp.id) return -1;
                if (b.appId === activeApp.id) return 1;
            }
            if (a.appId === 'TECHNICAL') return -1;
            if (b.appId === 'TECHNICAL') return 1;
            return 0;
        });
    }, [navigationGroups, pathname]);

    // Filtering logic
    const filteredGroups = useMemo(() => {
        const results: CommandGroup[] = sortedGroups.map(group => ({
            ...group,
            items: (group.items as MenuItem[]).filter((item: MenuItem) =>
                item.name.toLowerCase().includes(query.toLowerCase())
            ) as CommandItem[]
        })).filter(group => group.items.length > 0);

        const filteredSystemItems = systemGroup.items.filter((item: CommandItem) =>
            item.name.toLowerCase().includes(query.toLowerCase())
        );

        if (filteredSystemItems.length > 0) {
            results.push({
                ...systemGroup,
                items: filteredSystemItems
            });
        }

        return results;
    }, [sortedGroups, systemGroup, query]);

    // Flatten for keyboard
    const flatItems = useMemo(() => {
        return filteredGroups.flatMap(group => group.items);
    }, [filteredGroups]);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation (Dialog context)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (!open) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
            } else if (e.key === "Enter" && flatItems[selectedIndex]) {
                e.preventDefault();
                handleItemExecute(flatItems[selectedIndex]);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, flatItems, selectedIndex, handleItemExecute]);

    return {
        open,
        setOpen,
        query,
        setQuery,
        selectedIndex,
        setSelectedIndex,
        filteredGroups,
        flatItems,
        handleItemExecute,
        t
    };
}
