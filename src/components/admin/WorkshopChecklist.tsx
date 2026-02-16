'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Wrench,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Manual {
    title: string;
    snippet: string;
    score: number;
}

interface Part {
    partName: string;
    category: string;
    quantity: number;
    specifications?: string | null;
    manuals?: Manual[];
}

interface WorkshopChecklistProps {
    analysis: {
        parts: Part[];
        complexity: string;
        estimatedHours?: number;
    };
    checkedItems: Record<number, boolean>;
    onCheckChange?: (items: Record<number, boolean>) => void;
    readOnly?: boolean;
}

export function WorkshopChecklist({ analysis, checkedItems, onCheckChange, readOnly = false }: WorkshopChecklistProps) {
    const t = useTranslations('workshop');
    const toggleItem = (index: number) => {
        if (readOnly || !onCheckChange) return;
        onCheckChange({
            ...checkedItems,
            [index]: !checkedItems[index]
        });
    };

    const progress = Math.round((Object.values(checkedItems).filter(Boolean).length / analysis.parts.length) * 100);

    return (
        <Card className="border-orange-200 bg-orange-50/20">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-800">
                        <Wrench className="w-4 h-4 text-orange-600" />
                        {t('checklist.title')} ({progress}%)
                    </CardTitle>
                    <Badge variant="outline" className="bg-white text-orange-700 border-orange-200">
                        {analysis.complexity} {t('orders.new.analysis.complexity').toUpperCase()}
                    </Badge>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-orange-100 rounded-full mt-2 overflow-hidden">
                    <div
                        className="h-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {analysis.parts.map((part, index) => (
                    <div
                        key={index}
                        className="p-3 bg-white rounded-lg border border-orange-100 shadow-sm transition-all hover:border-orange-300"
                    >
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id={`part-${index}`}
                                checked={!!checkedItems[index]}
                                onCheckedChange={() => toggleItem(index)}
                                disabled={readOnly}
                                className="mt-1 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                            />
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor={`part-${index}`}
                                        className={`font-bold text-sm cursor-pointer ${checkedItems[index] ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                                    >
                                        {part.partName}
                                    </Label>
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100 text-slate-500">
                                        x{part.quantity}
                                    </Badge>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {part.category} {part.specifications && `• ${part.specifications}`}
                                </div>

                                {/* Manuals Section */}
                                {part.manuals && part.manuals.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-50 space-y-1">
                                        <div className="text-[10px] font-bold text-teal-600 flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            {t('checklist.manuals_title')}
                                        </div>
                                        {part.manuals.map((manual, mIndex) => (
                                            <div key={mIndex} className="flex items-start gap-2 p-1.5 rounded bg-teal-50/50 hover:bg-teal-50 border border-transparent hover:border-teal-100 transition-colors group cursor-pointer">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-medium text-teal-900 truncate group-hover:text-teal-700">
                                                        {manual.title}
                                                    </p>
                                                    <p className="text-[9px] text-teal-600/80 line-clamp-1">
                                                        {manual.snippet}
                                                    </p>
                                                </div>
                                                <ExternalLink className="w-3 h-3 text-teal-400 group-hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
