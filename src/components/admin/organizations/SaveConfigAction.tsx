'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SaveConfigActionProps {
    onClick?: () => void;
    isLoading?: boolean;
    label?: string;
    formId?: string;
}

/**
 * 💾 SaveConfigAction (Shared)
 * Specialized button for header actions in configuration pages.
 */
export function SaveConfigAction({ onClick, isLoading, label, formId }: SaveConfigActionProps) {
    const t = useTranslations('common');

    return (
        <Button 
            onClick={onClick}
            disabled={isLoading}
            form={formId}
            type={formId ? "submit" : "button"}
            className="gap-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6"
        >
            <Save className={isLoading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            {label || t('actions.save') || 'Guardar'}
        </Button>
    );
}
