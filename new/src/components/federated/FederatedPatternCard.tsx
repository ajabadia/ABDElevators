
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ThumbsUp, Globe, AlertCircle } from 'lucide-react';
import { FederatedPattern } from '@/lib/schemas';
import { toast } from 'sonner';

interface Props {
    pattern: FederatedPattern;
    onValidated?: () => void;
}

export const FederatedPatternCard: React.FC<Props> = ({ pattern, onValidated }) => {
    const [isValidating, setIsValidating] = useState(false);
    const [hasValidated, setHasValidated] = useState(false);

    const handleValidate = async () => {
        setIsValidating(true);
        try {
            const res = await fetch('/api/federated/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patternId: pattern._id }),
            });

            if (res.ok) {
                setHasValidated(true);
                toast.success('¡Gracias! Tu validación ayuda a toda la red.');
                onValidated?.();
            } else {
                toast.error('No se pudo validar el patrón en este momento.');
            }
        } catch (error) {
            toast.error('Error de conexión.');
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                            Global Insight - Federated
                        </Badge>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {Math.round(pattern.confidenceScore * 100)}% Confianza
                    </Badge>
                </div>
                <CardTitle className="text-sm font-semibold mt-2 text-blue-900 dark:text-blue-100 leading-tight">
                    {pattern.problemVector}
                </CardTitle>
            </CardHeader>

            <CardContent className="pb-3 text-xs space-y-3">
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded border border-blue-100 dark:border-blue-900">
                    <p className="font-bold text-blue-800 dark:text-blue-400 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Solución Sugerida:
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                        {pattern.solutionVector}
                    </p>
                </div>

                <div className="flex flex-wrap gap-1">
                    {pattern.keywords.map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] text-slate-600 dark:text-slate-400">
                            #{tag}
                        </span>
                    ))}
                </div>
            </CardContent>

            <CardFooter className="pt-0 flex justify-between items-center text-[11px]">
                <span className="text-slate-500 flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> {pattern.validationCount + (hasValidated ? 1 : 0)} validaciones
                </span>

                <Button
                    size="sm"
                    variant={hasValidated ? "ghost" : "outline"}
                    disabled={isValidating || hasValidated}
                    onClick={handleValidate}
                    className="h-7 text-[10px] px-2"
                >
                    {hasValidated ? '¡Validado!' : '¿Fue util?'}
                </Button>
            </CardFooter>
        </Card>
    );
};
