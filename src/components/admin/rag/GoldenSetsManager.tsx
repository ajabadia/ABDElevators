'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus,
    Search,
    Trash2,
    Loader2,
    Database,
    Tag,
    ShieldAlert,
    MessageSquare,
    ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface GoldenSetEntry {
    _id: string;
    query: string;
    flowType: string;
    groundTruthAnswer: string;
    criticality: 'LOW' | 'MEDIUM' | 'HIGH';
    tags: string[];
    createdAt: string;
}

export function GoldenSetsManager() {
    const router = useRouter();
    const [entries, setEntries] = useState<GoldenSetEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    // Form State
    const [newEntry, setNewEntry] = useState({
        query: '',
        flowType: 'TECHNICAL_CHAT',
        groundTruthAnswer: '',
        criticality: 'MEDIUM' as const,
        tags: [] as string[],
        notes: ''
    });

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai/golden-sets');
            if (res.ok) {
                const result = await res.json();
                setEntries(result.data);
            }
        } catch (error) {
            toast.error('Error al cargar la colección');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleSave = async () => {
        if (!newEntry.query || !newEntry.groundTruthAnswer) {
            toast.error('Query y Ground Truth son obligatorios');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/ai/golden-sets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry)
            });

            if (res.ok) {
                toast.success('Entrada añadida con éxito');
                setIsDialogOpen(false);
                setNewEntry({
                    query: '',
                    flowType: 'TECHNICAL_CHAT',
                    groundTruthAnswer: '',
                    criticality: 'MEDIUM',
                    tags: [],
                    notes: ''
                });
                fetchEntries();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('Error al guardar la entrada');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar esta entrada?')) return;

        try {
            const res = await fetch(`/api/admin/ai/golden-sets/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Entrada eliminada');
                fetchEntries();
            }
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const handleRunBaseline = async () => {
        setIsRunning(true);
        try {
            const res = await fetch('/api/admin/ai/golden-sets/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Baseline Evaluation ' + format(new Date(), 'dd/MM/yyyy HH:mm')
                })
            });
            if (res.ok) {
                toast.success('Evaluación de Baseline iniciada en segundo plano');
            } else {
                throw new Error('Failed to start baseline');
            }
        } catch (error) {
            toast.error('Error al iniciar la evaluación');
        } finally {
            setIsRunning(false);
        }
    };

    const filteredEntries = entries.filter(e =>
        e.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por query o etiquetas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 rounded-xl"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={handleRunBaseline}
                        disabled={isRunning || entries.length === 0}
                        className="h-11 rounded-xl px-6 font-bold uppercase tracking-widest text-[10px] bg-teal-500/10 text-teal-600 hover:bg-teal-500/20"
                    >
                        {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                        Ejecutar Baseline
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 rounded-xl px-6 font-bold uppercase tracking-widest text-[10px]">
                                <Plus className="mr-2 h-4 w-4" />
                                Añadir Query
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                    <ShieldAlert className="text-primary" />
                                    Nueva "Ground Truth"
                                </DialogTitle>
                                <DialogDescription>
                                    Define una pregunta típica y su respuesta ideal para validar el RAG.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pregunta del Usuario</Label>
                                    <Input
                                        value={newEntry.query}
                                        onChange={(e) => setNewEntry({ ...newEntry, query: e.target.value })}
                                        placeholder="¿Cómo resetear el variador?"
                                        className="h-12 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Respuesta Ideal (Ground Truth)</Label>
                                    <Textarea
                                        value={newEntry.groundTruthAnswer}
                                        onChange={(e) => setNewEntry({ ...newEntry, groundTruthAnswer: e.target.value })}
                                        placeholder="Descripción técnica precisa..."
                                        className="min-h-[120px] rounded-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Criticidad</Label>
                                        <select
                                            className="w-full h-12 rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={newEntry.criticality}
                                            onChange={(e) => setNewEntry({ ...newEntry, criticality: e.target.value as any })}
                                        >
                                            <option value="LOW">Baja</option>
                                            <option value="MEDIUM">Media</option>
                                            <option value="HIGH">Alta</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tags (separados por coma)</Label>
                                        <Input
                                            placeholder="seguridad, reset..."
                                            onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value.split(',').map(s => s.trim()) })}
                                            className="h-12 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                                <Button onClick={handleSave} disabled={isSaving} className="font-black uppercase tracking-widest text-[10px] px-8">
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Database className="mr-2 h-4 w-4" />}
                                    Guardar en Colección
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center py-20 gap-4">
                            <Loader2 className="animate-spin text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analizando colección...</p>
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center py-20 gap-4 text-muted-foreground">
                            <MessageSquare size={48} className="opacity-20" />
                            <p className="font-bold">No hay entradas en esta colección de oro.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-none">
                                    <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Query</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Criticidad</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Etiquetas</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Creada</TableHead>
                                    <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEntries.map((entry) => (
                                    <TableRow key={entry._id} className="hover:bg-muted/50 border-border/50 transition-colors group">
                                        <TableCell className="px-8 py-5 max-w-md">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-900 line-clamp-2">{entry.query}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-2">
                                                    <Tag size={10} /> {entry.flowType}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={entry.criticality === 'HIGH' ? 'destructive' : entry.criticality === 'MEDIUM' ? 'secondary' : 'outline'} className="text-[9px] font-black tracking-widest px-2">
                                                {entry.criticality}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {entry.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="bg-slate-100 text-[9px] uppercase">{tag}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(entry.createdAt), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-xl"
                                                    onClick={() => router.push(`/agents/golden-sets/${entry._id}`)}
                                                >
                                                    <ExternalLink size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDelete(entry._id)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
