"use client";

import React from "react";
import { CommandGroup as CommandGroupType, CommandItem as CommandItemType } from "@/hooks/useCommandMenu";
import { CommandItem } from "./CommandItem";

interface CommandGroupProps {
    group: CommandGroupType;
    startIndex: number;
    selectedIndex: number;
    onSelect: (item: CommandItemType) => void;
    onHover: (index: number) => void;
}

/**
 * CommandGroup — ERA 14 Refactor
 * Group of command items with a label.
 */
export function CommandGroup({
    group,
    startIndex,
    selectedIndex,
    onSelect,
    onHover
}: CommandGroupProps) {
    return (
        <div className="mb-6 last:mb-0">
            <h4 className="mb-3 px-3 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">
                {group.label}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {group.items.map((item, idx) => {
                    const globalIdx = startIndex + idx;
                    const isSelected = selectedIndex === globalIdx;

                    return (
                        <CommandItem
                            key={item.href + item.name}
                            item={item}
                            isSelected={isSelected}
                            onSelect={() => onSelect(item)}
                            onMouseEnter={() => onHover(globalIdx)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
