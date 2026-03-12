"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CommandGroup as CommandGroupType, CommandItem as CommandItemType } from "@/hooks/useCommandMenu";
import { CommandGroup } from "./CommandGroup";

interface CommandListProps {
    filteredGroups: CommandGroupType[];
    selectedIndex: number;
    onSelect: (item: CommandItemType) => void;
    onHover: (index: number) => void;
    resultsCount: number;
}

/**
 * CommandList — ERA 14 Refactor
 * Renders the results list with groups and a footer.
 */
export function CommandList({
    filteredGroups,
    selectedIndex,
    onSelect,
    onHover,
    resultsCount
}: CommandListProps) {
    const t = useTranslations("common");

    return (
        <div className="max-h-[60vh] overflow-y-auto p-3 bg-slate-50/30 dark:bg-black/20">
            {filteredGroups.length === 0 && (
                <div className="py-12 text-center">
                    <p className="text-slate-400 font-medium">{t("command_menu.no_results")}</p>
                </div>
            )}
            
            {filteredGroups.map((group, groupIndex) => {
                let itemOffset = 0;
                for (let i = 0; i < groupIndex; i++) {
                    itemOffset += filteredGroups[i].items.length;
                }

                return (
                    <CommandGroup
                        key={group.label}
                        group={group}
                        startIndex={itemOffset}
                        selectedIndex={selectedIndex}
                        onSelect={onSelect}
                        onHover={onHover}
                    />
                );
            })}

            {/* System help footer */}
            <div className="mt-4 px-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>{resultsCount} {t("command_menu.results_found")}</span>
            </div>
        </div>
    );
}
