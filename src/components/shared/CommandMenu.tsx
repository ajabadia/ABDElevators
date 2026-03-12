"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCommandMenu } from "@/hooks/useCommandMenu";

// Modular Components
import { CommandTrigger } from "./command/CommandTrigger";
import { CommandInput } from "./command/CommandInput";
import { CommandList } from "./command/CommandList";

/**
 * CommandMenu — ERA 14 Refactor
 * 
 * Global command palette triggered by Cmd+K.
 * Refactored into a custom hook and modular components.
 */
export function CommandMenu() {
    const {
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
    } = useCommandMenu();

    return (
        <>
            <CommandTrigger onOpen={() => setOpen(true)} />
            
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 overflow-hidden max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{t("command_menu.title")}</DialogTitle>
                    </DialogHeader>

                    <CommandInput value={query} onChange={setQuery} />

                    <CommandList 
                        filteredGroups={filteredGroups}
                        selectedIndex={selectedIndex}
                        onSelect={handleItemExecute}
                        onHover={setSelectedIndex}
                        resultsCount={flatItems.length}
                    />

                    <div className="bg-slate-100 dark:bg-slate-900 p-2 text-center text-[10px] text-slate-400 font-mono">
                        {t("command_menu.esc_to_close").split("ESC")[0]}
                        <kbd className="font-sans font-bold">ESC</kbd>
                        {t("command_menu.esc_to_close").split("ESC")[1]}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
