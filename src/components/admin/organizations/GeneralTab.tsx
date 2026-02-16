
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { TenantConfig } from '@/lib/schemas';
import { useTranslations } from "next-intl";

interface GeneralTabProps {
    config: TenantConfig | null;
    setConfig: React.Dispatch<React.SetStateAction<TenantConfig | null>>;
}

export function GeneralTab({ config, setConfig }: GeneralTabProps) {
    const t = useTranslations('admin.organizations.general');
    const tComp = useTranslations('admin.organizations.general.compliance');
    const tInd = useTranslations('admin.organizations.general.industries');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="tenantId">{t('tenantId')}</Label>
                    <Input
                        id="tenantId"
                        value={config?.tenantId}
                        disabled
                        className="bg-slate-50 font-mono text-xs"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">{t('name')}</Label>
                    <Input
                        id="name"
                        value={config?.name}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="industry">{t('industry')}</Label>
                    <Select
                        value={config?.industry}
                        onValueChange={(val: any) => setConfig(prev => prev ? { ...prev, industry: val } : null)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t('industryPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ELEVATORS">{tInd('ELEVATORS')}</SelectItem>
                            <SelectItem value="LEGAL">{tInd('LEGAL')}</SelectItem>
                            <SelectItem value="MEDICAL">{tInd('MEDICAL')}</SelectItem>
                            <SelectItem value="IT">{tInd('IT')}</SelectItem>
                            <SelectItem value="GENERIC">{tInd('GENERIC')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
                    <h4 className="text-primary font-bold flex items-center gap-2">
                        <Info size={18} aria-hidden="true" />
                        {tComp('title')}
                    </h4>
                    <div className="space-y-4 text-sm text-slate-300">
                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span>{tComp('dataIsolation')}</span>
                            <Badge className="bg-primary/20 text-primary border-primary/30">{tComp('active')}</Badge>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <span>{tComp('dataRegion')}</span>
                            <span className="text-white">{tComp('regionValue')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>{tComp('encryption')}</span>
                            <Badge className="bg-primary/20 text-primary border-primary/30">{tComp('encryptionValue')}</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
