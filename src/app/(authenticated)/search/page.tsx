"use client"

import { ConversationalSearch } from "@/components/shared/ConversationalSearch"
import { Sparkles, Info } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/ui/page-header"
import { useTranslations } from "next-intl"

export default function SearchPage() {
    const t = useTranslations('admin.dashboard.search')

    return (
        <PageContainer spacing="loose">
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
            />

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ConversationalSearch />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start gap-6">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                        <Info className="w-6 h-6 text-teal-500" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-lg text-foreground">{t('engine_title')}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {t('engine_desc')}
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-[2rem] p-8 text-white shadow-xl shadow-teal-500/10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold">{t('privacy_title')}</h4>
                    </div>
                    <p className="text-xs text-teal-50/80 leading-relaxed">
                        {t('privacy_desc')}
                    </p>
                </div>
            </div>
        </PageContainer>
    )
}
