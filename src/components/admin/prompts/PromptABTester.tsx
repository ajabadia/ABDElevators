'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { Loader2, Play, FlaskConical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PromptABTester() {
    const t = useTranslations('admin.prompts.ab_tester');
    const [promptA, setPromptA] = useState('');
    const [promptB, setPromptB] = useState('');
    const [testInput, setTestInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{
        A: { result: string; duration: number };
        B: { result: string; duration: number };
    } | null>(null);

    const handleRunTest = async () => {
        if (!promptA || !promptB) {
            toast.error('Both prompts are required');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/admin/prompts/test-ab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promptA, promptB, testInput })
            });

            if (!response.ok) throw new Error('Test failed');

            const data = await response.json();
            setResults(data.results);
            toast.success('A/B Test completed successfully');
        } catch (error) {
            toast.error('Failed to execute A/B Test');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left: Configuration */}
            <div className="space-y-6 flex flex-col h-full">
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FlaskConical className="h-5 w-5" />
                            A/B Testing Configuration
                        </CardTitle>
                        <CardDescription>Compare two prompt versions against the same input.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="space-y-2 flex flex-col">
                                <Label>Prompt Variant A</Label>
                                <Textarea
                                    value={promptA}
                                    onChange={(e) => setPromptA(e.target.value)}
                                    placeholder="Enter system prompt V1..."
                                    className="font-mono text-xs flex-1 min-h-[200px]"
                                />
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <Label>Prompt Variant B</Label>
                                <Textarea
                                    value={promptB}
                                    onChange={(e) => setPromptB(e.target.value)}
                                    placeholder="Enter system prompt V2..."
                                    className="font-mono text-xs flex-1 min-h-[200px]"
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label>Test Context / Input</Label>
                            <Textarea
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                placeholder="Enter the user input or context to test against..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <Button onClick={handleRunTest} disabled={loading} className="w-full">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Run Comparison
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Right: Results */}
            <div className="space-y-6 flex flex-col h-full">
                <Card className="flex-1 flex flex-col bg-muted/10">
                    <CardHeader>
                        <CardTitle>Results & Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        {!results ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                Run a test to see results comparison.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 h-full">
                                <div className="space-y-2 flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline">Variant A</Badge>
                                        <span className="text-xs text-muted-foreground">{results.A.duration}ms</span>
                                    </div>
                                    <div className="p-4 rounded-md border bg-background font-mono text-xs whitespace-pre-wrap flex-1 overflow-auto max-h-[600px]">
                                        {results.A.result}
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline">Variant B</Badge>
                                        <span className="text-xs text-muted-foreground">{results.B.duration}ms</span>
                                    </div>
                                    <div className="p-4 rounded-md border bg-background font-mono text-xs whitespace-pre-wrap flex-1 overflow-auto max-h-[600px]">
                                        {results.B.result}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
