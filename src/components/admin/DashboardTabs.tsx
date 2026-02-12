"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";

// Context for sharing state between compound components
interface DashboardTabsContextValue {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const DashboardTabsContext = createContext<DashboardTabsContextValue | null>(null);

function useDashboardTabsContext() {
    const context = useContext(DashboardTabsContext);
    if (!context) {
        throw new Error("DashboardTabs compound components must be used within DashboardTabs");
    }
    return context;
}

// Main compound component
interface DashboardTabsProps {
    defaultTab: string;
    children: ReactNode;
    className?: string;
}

export function DashboardTabs({ defaultTab, children, className = "space-y-6 mt-8" }: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab);

    return (
        <DashboardTabsContext.Provider value={{ activeTab, setActiveTab }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className={className}>
                {children}
            </Tabs>
        </DashboardTabsContext.Provider>
    );
}

// TabsList compound component
interface TabsListProps {
    children: ReactNode;
    className?: string;
}

DashboardTabs.List = function TabsListComponent({
    children,
    className = "bg-muted p-1 rounded-2xl border border-border w-full flex justify-start overflow-x-auto"
}: TabsListProps) {
    return (
        <TabsList className={className}>
            {children}
        </TabsList>
    );
};

// Tab compound component
interface TabProps {
    id: string;
    icon?: LucideIcon;
    children: ReactNode;
    className?: string;
}

DashboardTabs.Tab = function TabComponent({ id, icon: Icon, children, className = "rounded-xl px-6" }: TabProps) {
    const iconClassName = Icon ? "gap-2" : "";

    return (
        <TabsTrigger value={id} className={`${className} ${iconClassName}`}>
            {Icon && <Icon size={16} aria-hidden="true" />}
            {children}
        </TabsTrigger>
    );
};

// Panel compound component with lazy loading support
interface PanelProps {
    id: string;
    lazy?: boolean;
    children: ReactNode;
    className?: string;
}

DashboardTabs.Panel = function PanelComponent({
    id,
    lazy = false,
    children,
    className = "outline-none"
}: PanelProps) {
    const { activeTab } = useDashboardTabsContext();
    const [hasBeenActive, setHasBeenActive] = useState(!lazy || activeTab === id);

    React.useEffect(() => {
        if (activeTab === id && !hasBeenActive) {
            setHasBeenActive(true);
        }
    }, [activeTab, id, hasBeenActive]);

    return (
        <TabsContent value={id} className={className}>
            {lazy && !hasBeenActive ? (
                <DashboardSkeleton />
            ) : (
                children
            )}
        </TabsContent>
    );
};

// Overview Panel - special case with animation
interface OverviewPanelProps {
    id: string;
    children: ReactNode;
}

DashboardTabs.OverviewPanel = function OverviewPanelComponent({ id, children }: OverviewPanelProps) {
    return (
        <TabsContent
            value={id}
            className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
            {children}
        </TabsContent>
    );
};
