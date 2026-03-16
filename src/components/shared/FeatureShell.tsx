import React from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';

interface FeatureShellProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    backHref?: string;
    animate?: boolean;
    highlight?: string;
    containerClassName?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * 🐚 FeatureShell (Phase 433)
 * Standardizes page layouts across the platform.
 * Encapsulates PageContainer and PageHeader.
 */
export function FeatureShell({ 
    title, 
    subtitle, 
    icon, 
    backHref, 
    animate, 
    highlight, 
    containerClassName,
    actions,
    children 
}: FeatureShellProps) {
    return (
        <PageContainer className={
            (animate ? "animate-in fade-in slide-in-from-bottom-4 duration-500 " : "") + 
            (containerClassName || "")
        }>
            <PageHeader
                title={title}
                subtitle={subtitle}
                icon={icon}
                backHref={backHref}
                highlight={highlight}
                actions={actions}
            />
            {children}
        </PageContainer>
    );
}
