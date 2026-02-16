'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Bot,
    User,
    FileText,
    AlertCircle,
    CheckCircle,
    Clock,
    Activity,
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
    const format = useFormatter();
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

    const getTypeName = (type: string) => {
        return t(`types.${type}`) || type;
    };

    if (loading) return (
        <div className="p-4 text-sm text-muted-foreground animate-pulse" role="status" aria-live="polite">
            <span className="sr-only">{t('loading')}</span>
            {t('loading')}
        </div>
    );

    if (error) return (
        <div className="p-4 text-sm text-destructive" role="alert">
            <AlertCircle className="inline h-4 w-4 mr-2" />
            {t('error', { message: error })}
        </div>
    );

    if (events.length === 0) return (
        <div className="p-4 text-sm text-muted-foreground" role="status">
            {t('empty')}
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
                    <div className="relative border-l border-muted ml-3 pl-6 pt-2 space-y-8">
                        {events.map((event, index) => (
                            <article
                                key={event.id || index}
                                className="relative group"
                                aria-labelledby={`event-title-${event.id}`}
                            >
                                {/* Dot Indicator */}
                                <div className={cn(
                                    "absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-background ring-1 ring-muted transition-colors",
                                    event.level === 'ERROR' ? "bg-destructive ring-destructive/30" :
                                        event.type === 'IA' ? "bg-purple-500 ring-purple-500/30" :
                                            event.type === 'HUMAN' ? "bg-blue-500 ring-blue-500/30" :
                                                "bg-muted-foreground ring-muted-foreground/30"
                                )} aria-hidden="true" />

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase font-bold tracking-wider">
                                                {event.source}
                                            </Badge>
                                            <span id={`event-title-${event.id}`} className="text-xs font-medium text-foreground">
                                                {event.action}
                                            </span>
                                        </div>
                                        <time
                                            dateTime={event.timestamp}
                                            className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1"
                                        >
                                            <Clock className="h-3 w-3" aria-hidden="true" />
                                            {format.dateTime(new Date(event.timestamp), {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric'
                                            })}
                                        </time>
                                    </div>

                                    <div className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md border border-border/50">
                                        <div className="flex items-start gap-2">
                                            {getIconForType(event.type)}
                                            <span className="flex-1">{event.message}</span>
                                        </div>

                                        {event.details && (
                                            <div className="mt-2 pt-2 border-t border-border/50 text-xs font-mono text-muted-foreground/70 overflow-x-auto">
                                                {JSON.stringify(filterDetails(event.details), null, 2)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded-sm">
                                            {t('actor')}: {event.actor}
                                        </span>
                                        {event.correlationId && (
                                            <span className="text-[10px] text-muted-foreground/50 font-mono" title="Correlation ID">
                                                #{event.correlationId.slice(0, 8)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
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

function filterDetails(details: any) {
    if (!details) return null;
    const { ip, ipHash, userEmailHash, ...rest } = details;
    if (Object.keys(rest).length === 0) return null;
    return rest;
}
