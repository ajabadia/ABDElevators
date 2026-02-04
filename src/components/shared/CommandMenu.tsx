"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    Moon,
    Sun,
    Laptop,
} from "lucide-react";
import { useNavigation } from "@/hooks/use-navigation";

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const router = useRouter();
    const { setTheme } = useTheme();
    const navigationGroups = useNavigation();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    // Filter items
    const filteredGroups = navigationGroups.map(group => ({
        ...group,
        items: group.items.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase())
        )
    })).filter(group => group.items.length > 0);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                data-tour="global-search"
                className="hidden lg:flex items-center gap-2 px-3 py-2 min-w-[300px] text-sm text-slate-500 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700/50 rounded-xl hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm"
            >
                <Search size={16} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                <span className="flex-1 text-left font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">Quick Navigation...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-bold text-slate-500 opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 overflow-hidden max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Command Menu</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <Search className="mr-3 h-5 w-5 shrink-0 opacity-50 text-teal-600" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type a command or search..."
                            className="flex h-16 w-full bg-transparent py-3 text-lg outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 text-slate-800 dark:text-slate-100 font-medium"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-3 bg-slate-50/30 dark:bg-black/20">
                        {filteredGroups.length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-slate-400 font-medium">No se encontraron resultados.</p>
                            </div>
                        )}
                        {filteredGroups.map((group) => (
                            <div key={group.label} className="mb-6 last:mb-0">
                                <h4 className="mb-3 px-3 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                                    {group.label}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {group.items.map((item) => (
                                        <div
                                            key={item.href}
                                            onClick={() => runCommand(() => router.push(item.href))}
                                            className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-teal-500/50 hover:shadow-md transition-all group"
                                        >
                                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-teal-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 transition-colors">
                                                <item.icon size={18} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                                                {item.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="mb-3 px-3 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                                System Commands
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div
                                    onClick={() => runCommand(() => setTheme("light"))}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors opacity-70 hover:opacity-100"
                                >
                                    <Sun size={16} />
                                    <span className="text-xs font-bold">Light Mode</span>
                                </div>
                                <div
                                    onClick={() => runCommand(() => setTheme("dark"))}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors opacity-70 hover:opacity-100"
                                >
                                    <Moon size={16} />
                                    <span className="text-xs font-bold">Dark Mode</span>
                                </div>
                                <div
                                    onClick={() => runCommand(() => setTheme("system"))}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors opacity-70 hover:opacity-100"
                                >
                                    <Laptop size={16} />
                                    <span className="text-xs font-bold">System Theme</span>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900 p-2 text-center text-[10px] text-slate-400 font-mono">
                        Press <kbd className="font-sans font-bold">ESC</kbd> to close
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
