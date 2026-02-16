'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Timeline } from '@/components/ui/timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AlertCircle,
    Activity,
    Bot,
    User,
    FileText,
    Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
    id: string;
    timestamp: string;
    type: 'IA' | 'HUMAN' | 'SYSTEM' | 'INGEST';
    source: string;
    action: string;
    message: string;
    actor: string;
    details?: any;
    level: string;
    correlationId?: string;
}

interface EntityTimelineProps {
    entityId: string;
    className?: string;
}

export function EntityTimeline({ entityId, className }: EntityTimelineProps) {
    const t = useTranslations('admin.dashboard.timeline');
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                const res = await fetch(`/api/admin/cases/${entityId}/timeline`);
                if (!res.ok) throw new Error('Failed to fetch timeline');
                const data = await res.json();
                setEvents(data.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (entityId) {
            fetchTimeline();
        }
    }, [entityId]);

    // Map specific entity events to generic timeline items
    const timelineItems = events.map(event => {
        let variant: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default';
        if (event.level === 'ERROR') variant = 'error';
        else if (event.type === 'IA') variant = 'info';
        else if (event.type === 'HUMAN') variant = 'default'; // blue-ish in generic is default or info
        else if (event.type === 'SYSTEM') variant = 'warning';

        return {
            id: event.id,
            title: event.action,
            description: event.message,
            timestamp: event.timestamp,
            variant: variant,
            icon: getIconForType(event.type)
        };
    });

    if (error) return (
        <div className="p-4 text-sm text-destructive" role="alert">
            <AlertCircle className="inline h-4 w-4 mr-2" />
            {t('error', { message: error })}
        </div>
    );

    return (
        <Card className={cn("h-full flex flex-col", className)}>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
                    {t('title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[600px] px-6 pb-6" role="feed" aria-label={t('title')}>
                    <Timeline items={timelineItems} loading={loading} />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

function getIconForType(type: string) {
    switch (type) {
        case 'IA': return <Bot className="h-4 w-4 text-purple-500 mt-0.5" aria-hidden="true" />;
        case 'HUMAN': return <User className="h-4 w-4 text-blue-500 mt-0.5" aria-hidden="true" />;
        case 'INGEST': return <Database className="h-4 w-4 text-amber-500 mt-0.5" aria-hidden="true" />;
        default: return <FileText className="h-4 w-4 text-gray-400 mt-0.5" aria-hidden="true" />;
    }
}
