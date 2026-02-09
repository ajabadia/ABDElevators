
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, Server, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TenantConfig } from '@/app/(authenticated)/(admin)/admin/organizations/page';

interface StorageTabProps {
    config: TenantConfig | null;
    setConfig: React.Dispatch<React.SetStateAction<TenantConfig | null>>;
    usageStats: any;
}

export function StorageTab({ config, setConfig, usageStats }: StorageTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
                <Label className="text-slate-700 font-semibold">Proveedor de Infraestructura</Label>
                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => setConfig(prev => prev ? { ...prev, storage: { ...prev.storage, provider: 'cloudinary' } } : null)}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${config?.storage?.provider === 'cloudinary' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                        <Cloud className={config?.storage?.provider === 'cloudinary' ? 'text-primary' : 'text-slate-400'} size={24} />
                        <h4 className="font-bold mt-2">Cloudinary</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Óptimo para PDFs e imágenes con CDN.</p>
                    </div>
                    <div className="p-6 rounded-2xl border-2 border-slate-100 opacity-50 cursor-not-allowed bg-slate-50/50 relative overflow-hidden group">
                        <Server className="text-slate-400" size={24} />
                        <h4 className="font-bold mt-2 text-slate-400">AWS S3</h4>
                        <div className="absolute top-2 right-2 rotate-12 bg-slate-200 text-slate-500 text-[8px] px-2 py-0.5 rounded-full font-bold">PRÓXIMAMENTE</div>
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <Label htmlFor="folder_prefix">Directorio Raíz (Storage Isolation)</Label>
                    <Input
                        id="folder_prefix"
                        value={config?.storage?.settings?.folder_prefix || ''}
                        onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            storage: {
                                ...prev.storage,
                                settings: { ...(prev.storage?.settings || {}), folder_prefix: e.target.value }
                            }
                        } : null)}
                        className="font-mono text-xs bg-slate-50"
                    />
                    <p className="text-[10px] text-slate-400">Determina la carpeta base en el cloud para este tenant.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="p-6 rounded-2xl border bg-slate-50/30 space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <Label className="text-slate-700 font-semibold">Cuota Máxima de Disco</Label>
                            <p className="text-xs text-slate-500">Límite de documentos procesados.</p>
                        </div>
                        <span className="text-3xl font-bold font-outfit text-primary">
                            {config?.storage?.quota_bytes ? Math.round(config.storage.quota_bytes / (1024 * 1024)) : 0} MB
                        </span>
                    </div>
                    <Input
                        type="number"
                        value={config?.storage?.quota_bytes ? Math.round(config.storage.quota_bytes / (1024 * 1024)) : 0}
                        onChange={(e) => {
                            const mb = parseInt(e.target.value) || 0;
                            setConfig(prev => prev ? {
                                ...prev,
                                storage: {
                                    ...prev.storage,
                                    quota_bytes: mb * 1024 * 1024
                                }
                            } : null);
                        }}
                        className="text-lg font-bold"
                    />

                    {/* Real-time Usage Visualization */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-end text-xs">
                            <span className="text-slate-500 font-medium">Uso Actual (Cloudinary / Storage)</span>
                            <span className="font-bold text-slate-700">
                                {usageStats?.storage ? Math.round(usageStats.storage / (1024 * 1024)) : 0} MB / {config?.storage?.quota_bytes ? Math.round(config.storage.quota_bytes / (1024 * 1024)) : 0} MB
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    (usageStats?.storage / (config?.storage?.quota_bytes || 1)) > 0.9 ? "bg-red-500" :
                                        (usageStats?.storage / (config?.storage?.quota_bytes || 1)) > 0.7 ? "bg-amber-500" : "bg-primary"
                                )}
                                style={{ width: `${Math.min(100, Math.round((usageStats?.storage || 0) / (config?.storage?.quota_bytes || 1) * 100))}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 italic">Métrica de consumo en tiempo real</span>
                            <span className={cn(
                                "font-bold",
                                (usageStats?.storage / (config?.storage?.quota_bytes || 1)) > 0.9 ? "text-red-600" : "text-slate-500"
                            )}>
                                {Math.round((usageStats?.storage || 0) / (config?.storage?.quota_bytes || 1) * 100)}% Utilizado
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <AlertCircle size={16} />
                        <span className="text-[10px]">Al superar la cuota, se bloqueará el acceso a nuevas peticiones de análisis.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
