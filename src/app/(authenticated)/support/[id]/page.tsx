
"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    ArrowLeft,
    Send,
    Loader2,
    Ticket as TicketIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateLong, formatDateTime } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/support/TicketBadges';
import { TicketDetailSkeleton } from '@/components/shared/LoadingSkeleton';
import { useApiItem } from '@/hooks/useApiItem';
import { useApiMutation } from '@/hooks/useApiMutation';

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    createdAt: string;
    messages?: Array<{
        id: string;
        author: 'User' | 'Support' | 'System';
        content: string;
        timestamp: string;
    }>;
}

export default function ClientTicketDetailPage({ params }: { params: { id: string } }) {
    const t = useTranslations('support.page');
    const tCat = useTranslations('support.category');
    const tDetail = useTranslations('support.detail');
    const [reply, setReply] = useState('');

    const { data: ticket, isLoading, refresh } = useApiItem<Ticket>({
        endpoint: `/api/support/tickets/${params.id}`,
        dataKey: 'ticket'
    });

    const { mutate: sendReply, isLoading: isSending } = useApiMutation({
        endpoint: `/api/support/tickets/${params.id}/reply`,
        method: 'POST',
        onSuccess: () => {
            setReply('');
            refresh();
        },
        successMessage: tDetail('messageSent')
    });

    const handleSendReply = () => {
        if (!reply.trim()) return;
        sendReply({ content: reply });
    };

    if (isLoading && !ticket) return (
        <div className="p-8 max-w-4xl mx-auto space-y-6 mt-10">
            <TicketDetailSkeleton />
        </div>
    );

    if (!ticket) return (
        <div className="p-20 text-center">
            <h2 className="text-xl font-black text-slate-900">{tDetail('notFound')}</h2>
            <Link href="/support">
                <Button variant="link" className="text-blue-600 font-bold">{tDetail('backToSupport')}</Button>
            </Link>
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <Link href="/support" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" /> {t('myTickets')}
            </Link>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider border border-slate-100 dark:border-slate-700">
                            {ticket.ticketNumber}
                        </span>
                        <TicketStatusBadge status={ticket.status} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700">
                        {tDetail('opened')}: {formatDateLong(ticket.createdAt)}
                    </span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight tracking-tight">{ticket.subject}</h1>
                <div className="flex gap-2">
                    <TicketPriorityBadge priority={ticket.priority} />
                    <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl font-black uppercase text-[10px] tracking-widest border border-blue-100/50">
                        {tCat(ticket.category as any)}
                    </span>
                </div>
            </div>

            <div className="space-y-8 py-8 border-l-2 border-slate-100 dark:border-slate-800 ml-5 pl-10 pr-2">
                <div className="relative">
                    <div className="absolute -left-[51px] top-0 w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-white text-[10px] shadow-lg ring-4 ring-white dark:ring-slate-950">
                        ME
                    </div>
                    <div className="space-y-2">
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{tDetail('initialDescription')}</div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl rounded-tl-none border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xl shadow-slate-200/40 relative">
                            <p className="whitespace-pre-wrap leading-relaxed font-medium">{ticket.description}</p>
                        </div>
                    </div>
                </div>

                {ticket.messages?.map((msg) => (
                    <div key={msg.id} className={cn("relative", msg.author === 'Support' ? "flex flex-col items-end" : "")}>
                        <div className={cn(
                            "absolute top-0 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[10px] shadow-lg ring-4 ring-white dark:ring-slate-950",
                            msg.author === 'User'
                                ? "-left-[51px] bg-slate-800 text-white"
                                : "-left-[51px] bg-blue-600 text-white"
                        )}>
                            {msg.author === 'User' ? 'ME' : <TicketIcon size={16} aria-hidden="true" />}
                        </div>
                        <div className={cn("space-y-2 max-w-[90%]", msg.author === 'User' ? "" : "items-end flex flex-col")}>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                {msg.author === 'User' ? tDetail('yourReply') : tDetail('technicalSupport')}
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="font-mono">{formatDateTime(msg.timestamp).split(',')[1].trim()}</span>
                            </div>
                            <div className={cn(
                                "p-6 rounded-3xl shadow-xl border whitespace-pre-wrap leading-relaxed font-medium",
                                msg.author === 'User'
                                    ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-slate-200/40"
                                    : "bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-blue-500/20"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] sticky bottom-8">
                <Textarea
                    placeholder={tDetail('replyPlaceholder')}
                    className="min-h-[120px] resize-none mb-6 bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 rounded-2xl p-6 focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center sm:text-left">
                        {tDetail('replyHint')}
                    </p>
                    <Button
                        onClick={handleSendReply}
                        disabled={!reply.trim() || isSending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl h-14 px-10 shadow-xl shadow-blue-500/30 group transition-all"
                    >
                        {isSending ? (
                            <Loader2 className="animate-spin w-5 h-5" aria-hidden="true" />
                        ) : (
                            <div className="flex items-center gap-3">
                                {tDetail('sendMessage')}
                                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" aria-hidden="true" />
                            </div>
                        )}
                    </Button>
                </div>
            </div>
            <div className="h-20" />
        </div>
    );
}
