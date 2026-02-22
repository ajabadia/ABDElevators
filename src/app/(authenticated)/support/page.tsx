
"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Plus,
    LifeBuoy,
    MessageSquare,
    Search,
    Clock,
    ArrowRight,
    Sparkles,
    RefreshCw,
    Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/support/TicketBadges';
import { formatRelative } from '@/lib/date-utils';
import { Input } from '@/components/ui/input';
import { AgenticSupportSearch } from '@/components/technical/AgenticSupportSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiList } from '@/hooks/useApiList';
import { TicketListSkeleton } from '@/components/shared/LoadingSkeleton';

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    priority: string;
    category: string;
    createdAt: string;
}

export default function ClientSupportPage() {
    const t = useTranslations('support.page');
    const tCat = useTranslations('support.category');
    const [search, setSearch] = useState('');

    const { data: tickets, isLoading, refresh } = useApiList<Ticket>({
        endpoint: '/api/support/tickets',
        dataKey: 'tickets',
    });

    const filteredTickets = (tickets || []).filter(t =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 overflow-hidden relative p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/40">
                            <LifeBuoy className="w-8 h-8 text-white" aria-hidden="true" />
                        </div>
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">
                        {t('subtitle')}
                    </p>
                </div>
                <div className="relative z-10">
                    <Link href="/support/nuevo">
                        <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 group">
                            <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" aria-hidden="true" /> {t('newTicket')}
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="ai-search" className="space-y-8">
                <div className="flex justify-center">
                    <TabsList className="bg-slate-100 dark:bg-slate-800 p-1.5 h-16 rounded-[1.5rem] grid grid-cols-2 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-inner">
                        <TabsTrigger value="ai-search" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all">
                            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" /> {t('aiSearch')}
                        </TabsTrigger>
                        <TabsTrigger value="tickets" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all">
                            <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" /> {t('myTickets')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="ai-search" className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">
                    <AgenticSupportSearch />
                </TabsContent>

                <TabsContent value="tickets" className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[500px]">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 flex flex-col sm:flex-row gap-6 justify-between items-center">
                            <div className="relative w-full sm:w-[400px]">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                                <Input
                                    placeholder={t('searchPlaceholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-12 h-14 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                                    {(tickets || []).length} {t('records')}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => refresh()}
                                    className="h-12 w-12 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 shadow-sm transition-all"
                                    aria-label="Refresh"
                                >
                                    <RefreshCw size={18} className={isLoading ? "animate-spin text-blue-600" : "text-slate-400"} aria-hidden="true" />
                                </Button>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {isLoading && (!tickets || tickets.length === 0) ? (
                                <div className="p-8">
                                    <TicketListSkeleton />
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
                                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                                        <Inbox className="w-10 h-10 text-slate-300" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">{t('noTickets')}</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium">
                                        {t('noTicketsDesc')}
                                    </p>
                                    <Link href="/support/nuevo">
                                        <Button className="rounded-2xl h-14 px-10 border-2 border-slate-900 bg-transparent text-slate-900 hover:bg-slate-900 hover:text-white transition-all font-black text-xs uppercase tracking-widest">
                                            {t('createFirst')}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                filteredTickets.map(ticket => (
                                    <div key={ticket._id} className="p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group flex flex-col sm:flex-row gap-8 items-start sm:items-center cursor-default border-l-4 border-l-transparent hover:border-l-blue-600">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                                                    {ticket.ticketNumber}
                                                </span>
                                                <TicketStatusBadge status={ticket.status} />
                                                <TicketPriorityBadge priority={ticket.priority} />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors tracking-tight">
                                                {ticket.subject}
                                            </h3>
                                            <div className="flex items-center gap-6 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                <span className="flex items-center gap-2">
                                                    <Clock size={14} className="text-slate-300" aria-hidden="true" /> {formatRelative(ticket.createdAt)}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-blue-600/60">
                                                    {tCat(ticket.category as any)}
                                                </span>
                                            </div>
                                        </div>
                                        <Link href={`/support/${ticket._id}`} className="shrink-0 w-full sm:w-auto">
                                            <Button variant="ghost" className="h-14 px-8 rounded-2xl text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 border border-transparent hover:border-blue-100 font-black text-[10px] uppercase tracking-widest w-full">
                                                {t('viewConversation')} <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
