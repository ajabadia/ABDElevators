import React from 'react';
import dynamic from 'next/dynamic';
import { Layers, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface PromptTemplateEditorProps {
    template: string;
    onChange: (value: string) => void;
    maxLength?: number;
    isEdit: boolean;
    onLoadExample: () => void;
}

export const PromptTemplateEditor: React.FC<PromptTemplateEditorProps> = ({
    template,
    onChange,
    maxLength,
    isEdit,
    onLoadExample
}) => {
    const t = useTranslations('admin.prompts.editor');
    const isLengthExceeded = maxLength !== undefined && template.length > maxLength;

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Layers size={12} /> {t('template_title')}
                </h3>
                <div className="flex items-center gap-2">
                    {!isEdit && (
                        <Button onClick={onLoadExample} variant="ghost" size="sm" className="h-7 text-[10px] text-teal-400 hover:bg-teal-400/10">
                            <Sparkles size={12} className="mr-1" /> {t('load_example')}
                        </Button>
                    )}
                    <Badge variant="outline" className={cn(
                        "text-[10px] px-2 py-0 border-slate-800",
                        isLengthExceeded ? "text-rose-500 border-rose-500/50" : "text-slate-500"
                    )}>
                        {template.length} {maxLength ? `/ ${maxLength}` : t('chars')}
                    </Badge>
                </div>
            </div>

            <div className="flex-1 min-h-[500px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative">
                <MonacoEditor
                    height="100%"
                    defaultLanguage="markdown"
                    value={template}
                    onChange={(value) => onChange(value ?? '')}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        padding: { top: 20, bottom: 20 }
                    }}
                />
            </div>

            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t('tips_title')}</h4>
                <ul className="text-[11px] text-slate-400 space-y-2">
                    <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1 shrink-0" />
                        {t('tip_1')}
                    </li>
                    <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1 shrink-0" />
                        {t('tip_2')}
                    </li>
                    <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1 shrink-0" />
                        {t('tip_3')}
                    </li>
                </ul>
            </div>
        </div>
    );
};
