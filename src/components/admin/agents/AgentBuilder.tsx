"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Bot, Save, Sparkles, BookCopy, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/page-header';

/**
 * 🤖 Agent Configuration Interface
 */
export interface AgentConfig {
    name: string;
    promptTemplate: 'GENERAL_ASSISTANT' | 'AUDITOR' | 'WRITER' | string;
    collection: 'default' | 'technical' | 'regulatory' | string;
    expertMode: boolean;
    confidenceThreshold: number;
}

export function AgentBuilder() {
    const t = useTranslations('admin.ai_agents');
    const [config, setConfig] = useState<AgentConfig>({
        name: '',
        promptTemplate: 'GENERAL_ASSISTANT',
        collection: 'default',
        expertMode: false,
        confidenceThreshold: 0.7
    });

    const handleSave = () => {
        toast.success(t('actions.save_success'), {
            description: t('actions.save_success_desc', { name: config.name })
        });
    };

    return (
        <div
            className="grid gap-6 md:grid-cols-2 animate-in slide-in-from-bottom-4 duration-500"
            role="main"
            aria-label={t('title')}
        >
            <Card className="border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        {t('identification.title')}
                    </CardTitle>
                    <CardDescription>{t('identification.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="agent-name">{t('identification.name_label')}</Label>
                        <Input
                            id="agent-name"
                            aria-required="true"
                            placeholder={t('identification.name_placeholder')}
                            value={config.name}
                            onChange={(e) => setConfig({ ...config, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('identification.personality_label')}</Label>
                        <Select
                            value={config.promptTemplate}
                            onValueChange={(v) => setConfig({ ...config, promptTemplate: v })}
                        >
                            <SelectTrigger id="personality-select" aria-label={t('identification.personality_label')}>
                                <SelectValue placeholder={t('identification.select_template')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GENERAL_ASSISTANT">{t('identification.templates.general')}</SelectItem>
                                <SelectItem value="AUDITOR">{t('identification.templates.auditor')}</SelectItem>
                                <SelectItem value="WRITER">{t('identification.templates.writer')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-primary" />
                        {t('engine.title')}
                    </CardTitle>
                    <CardDescription>{t('engine.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>{t('engine.expert_mode_label')}</Label>
                            <p className="text-[10px] text-muted-foreground">{t('engine.expert_mode_desc')}</p>
                        </div>
                        <Switch
                            id="expert-mode"
                            aria-label={t('engine.expert_mode_label')}
                            checked={config.expertMode}
                            onCheckedChange={(v) => setConfig({ ...config, expertMode: v })}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label>{t('engine.confidence_label')}</Label>
                            <span className="text-xs font-mono">{Math.round(config.confidenceThreshold * 100)}%</span>
                        </div>
                        <Slider
                            id="confidence-threshold"
                            aria-label={t('engine.confidence_label')}
                            value={[config.confidenceThreshold * 100]}
                            max={100}
                            step={5}
                            onValueChange={([v]) => setConfig({ ...config, confidenceThreshold: v / 100 })}
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                            {t('engine.confidence_hint')}
                        </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                        <Label className="flex items-center gap-2">
                            <BookCopy className="h-4 w-4" />
                            {t('engine.knowledge_scope')}
                        </Label>
                        <Select value={config.collection} onValueChange={(v) => setConfig({ ...config, collection: v })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">{t('engine.scopes.default')}</SelectItem>
                                <SelectItem value="technical">{t('engine.scopes.technical')}</SelectItem>
                                <SelectItem value="regulatory">{t('engine.scopes.regulatory')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="bg-accent/50 rounded-b-lg border-t py-3">
                    <Button className="w-full gap-2" onClick={handleSave}>
                        <Save className="h-4 w-4" />
                        {t('actions.deploy')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
