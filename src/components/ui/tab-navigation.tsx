"use client";

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";

export interface TabItem {
    value: string;
    label: string | React.ReactNode;
    content?: React.ReactNode;
    badge?: string | number;
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
    disabled?: boolean;
}

interface TabNavigationProps {
    tabs: TabItem[];
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
}

export function TabNavigation({ tabs, defaultValue, value, onValueChange, className }: TabNavigationProps) {
    const t = useTranslations('components.TabNavigation');

    return (
        <Tabs
            defaultValue={defaultValue || tabs[0]?.value}
            value={value}
            onValueChange={onValueChange}
            className={cn("w-full", className)}
        >
            <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg mb-6 overflow-x-auto flex-nowrap">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        disabled={tab.disabled}
                        className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all duration-200"
                    >
                        {tab.label}
                        {tab.badge !== undefined && (
                            <Badge
                                variant={tab.badgeVariant || "secondary"}
                                className="px-1.5 py-0 min-w-[1.25rem] h-5 text-[10px] flex items-center justify-center"
                            >
                                {tab.badge}
                            </Badge>
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>

            {tabs.map((tab) => (
                tab.content && (
                    <TabsContent key={tab.value} value={tab.value} className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {tab.content}
                    </TabsContent>
                )
            ))}
        </Tabs>
    );
}
