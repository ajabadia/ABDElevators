"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, FileText, Bot, UserCheck, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MOCK_AUDITS = [
    { id: '1', doc: 'Manual v2.1', aiJudge: 'PASS', score: '98%', user: 'Admin', action: 'Approved', timestamp: '2026-03-07 14:20' },
    { id: '2', doc: 'Order #4590', aiJudge: 'WARNING', score: '72%', user: 'Operator', action: 'Flagged', timestamp: '2026-03-07 15:05' },
    { id: '3', doc: 'Regulatory EU-30', aiJudge: 'PASS', score: '95%', user: 'System', action: 'Auto-Synced', timestamp: '2026-03-07 16:45' },
    { id: '4', doc: 'Safety Checklist', aiJudge: 'FAIL', score: '45%', user: 'Admin', action: 'Rejected', timestamp: '2026-03-07 17:30' },
];

export function ComplianceAudit() {
    return (
        <Card className="border border-primary/10 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Universal Intelligence Audit
                        </CardTitle>
                        <CardDescription>Tracing the lifecycle from Document to AI Audit to User Action (SOC2).</CardDescription>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search logs..." className="pl-8 h-9 rounded-lg" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-950 border-none">
                            <TableHead className="font-bold text-[10px] text-slate-500"><FileText className="inline mr-2 h-4 w-4" /> Source</TableHead>
                            <TableHead className="font-bold text-[10px] text-slate-500"><Bot className="inline mr-2 h-4 w-4" /> AI Audit</TableHead>
                            <TableHead className="font-bold text-[10px] text-slate-500"><UserCheck className="inline mr-2 h-4 w-4" /> Action</TableHead>
                            <TableHead className="text-right font-bold text-[10px] text-slate-500">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_AUDITS.map((audit) => (
                            <TableRow key={audit.id} className="hover:bg-accent/10 transition-colors">
                                <TableCell className="font-medium">{audit.doc}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={audit.aiJudge === 'PASS' ? 'success' : audit.aiJudge === 'FAIL' ? 'destructive' : 'warning'} className="text-[10px] font-bold rounded-lg border">
                                            {audit.aiJudge}
                                        </Badge>
                                        <span className="text-[10px] font-mono opacity-60">{audit.score}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{audit.action}</span>
                                        <span className="text-[10px] text-muted-foreground">By {audit.user}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-[10px] opacity-70">{audit.timestamp}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
