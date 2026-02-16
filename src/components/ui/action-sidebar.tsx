"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose
} from "@/components/ui/sheet";
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    disabled?: boolean;
    description?: string;
}

interface ActionSidebarProps {
    title?: string;
    description?: string;
    triggerLabel?: React.ReactNode;
    actions: ActionItem[];
    className?: string;
    side?: "top" | "bottom" | "left" | "right";
}

export function ActionSidebar({
    title,
    description,
    triggerLabel,
    actions,
    className,
    side = "right"
}: ActionSidebarProps) {
    const t = useTranslations('components.ActionSidebar');
    const defaultTitle = t('actions');

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className={className}>
                    {triggerLabel || <Menu className="w-4 h-4" />}
                </Button>
            </SheetTrigger>
            <SheetContent side={side} className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle>{title || defaultTitle}</SheetTitle>
                    {description && <SheetDescription>{description}</SheetDescription>}
                </SheetHeader>

                <div className="flex flex-col gap-3 mt-8">
                    {actions.map((action, index) => (
                        <div key={index} className="flex flex-col gap-1">
                            <SheetClose asChild>
                                <Button
                                    variant={action.variant || "secondary"}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    className={cn("w-full justify-start h-auto py-3 px-4", action.variant === 'ghost' ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : '')}
                                >
                                    {action.icon && <span className="mr-3">{action.icon}</span>}
                                    <span className="flex-1 text-left">{action.label}</span>
                                </Button>
                            </SheetClose>
                            {action.description && (
                                <p className="text-[10px] text-slate-500 px-4">{action.description}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                    <SheetClose asChild>
                        <Button variant="outline" className="w-full">
                            {t('close')}
                        </Button>
                    </SheetClose>
                </div>
            </SheetContent>
        </Sheet>
    );
}
