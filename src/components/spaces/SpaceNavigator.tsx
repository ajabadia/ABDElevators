"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
    ChevronRight,
    ChevronDown,
    Globe,
    Building2,
    Users,
    User,
    Box,
    Folder,
    FolderOpen,
    Search,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useApiList } from "@/hooks/useApiList";
import { Space, SpaceType } from "@/lib/schemas/spaces";

interface SpaceNodeProps {
    space: Space;
    level: number;
    onSelect: (space: Space) => void;
    selectedId?: string;
}

interface SpaceNodeWithTProps extends SpaceNodeProps {
    t: (key: string) => string;
}

const SpaceNode: React.FC<SpaceNodeWithTProps> = ({ space, level, onSelect, selectedId, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isSelected = selectedId === space._id?.toString();

    const { data: children, isLoading } = useApiList<Space>({
        endpoint: "/api/spaces",
        filters: { parentSpaceId: space._id?.toString() },
        autoFetch: isExpanded,
        dataKey: "items"
    });

    const getIcon = (type: SpaceType) => {
        switch (type) {
            case "GLOBAL": return Globe;
            case "INDUSTRY": return Box;
            case "TENANT": return Building2;
            case "TEAM": return Users;
            case "PERSONAL": return User;
            default: return Folder;
        }
    };

    const Icon = getIcon(space.type);

    return (
        <div className="flex flex-col">
            <button
                onClick={() => {
                    setIsExpanded(!isExpanded);
                    onSelect(space);
                }}
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left group w-full",
                    isSelected ? "bg-primary/10 text-primary font-bold shadow-sm" : "hover:bg-muted text-muted-foreground"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                aria-label={space.name}
            >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : children && children.length > 0 ? (
                        isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                    ) : (
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    )}
                </div>
                <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground")} />
                <span className="text-xs truncate flex-1">{space.name}</span>
                {space.config?.isDefault && (
                    <Badge variant="outline" className="h-4 px-1 text-[8px] uppercase tracking-tighter opacity-70">
                        {t("default")}
                    </Badge>
                )}
            </button>

            {isExpanded && children && children.length > 0 && (
                <div className="flex flex-col">
                    {children.map((child) => (
                        <SpaceNode
                            key={child._id?.toString()}
                            space={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedId={selectedId}
                            t={t}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export function SpaceNavigator({ onSelect, selectedId }: { onSelect: (space: Space) => void, selectedId?: string }) {
    const [search, setSearch] = useState("");
    const t = useTranslations("spaces.navigator");

    // Fetch root spaces (those without parentSpaceId)
    const { data: rootSpaces, isLoading } = useApiList<Space>({
        endpoint: "/api/spaces",
        filters: { isRoot: true, search: search || undefined },
        dataKey: "items"
    });

    return (
        <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" /> {t("title")}
                    </h3>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
                    <Input
                        placeholder={t("search_placeholder")}
                        className="pl-8 h-8 text-[11px] bg-muted/30 border-none focus-visible:ring-primary/30"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label={t("search_placeholder")}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 p-2">
                {isLoading && !rootSpaces ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-50">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t("loading")}</span>
                    </div>
                ) : rootSpaces && rootSpaces.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                        {rootSpaces.map((space) => (
                            <SpaceNode
                                key={space._id?.toString()}
                                space={space}
                                level={0}
                                onSelect={onSelect}
                                selectedId={selectedId}
                                t={t}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 opacity-30">
                        <Folder className="w-10 h-10 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t("empty")}</span>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
