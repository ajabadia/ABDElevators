"use client"

import { useState, useEffect } from "react"
import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/ui/page-header"
import { ContentCard } from "@/components/ui/content-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HelpButton } from "@/components/ui/help-button"
import { InlineHelpPanel } from "@/components/ui/inline-help-panel"
import {
    Upload,
    Search,
    History,
    FileText,
    CheckCircle2,
    Clock,
    TrendingUp,
    Sparkles,
    ArrowRight,
    HelpCircle,
    Zap
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface QuickStat {
    label: string
    value: string | number
    change?: string
    icon: React.ReactNode
    color: string
}

interface RecentActivity {
    id: string
    type: "upload" | "search" | "success"
    title?: string
    description?: string
    message?: string // De la nueva API
    timestamp: string
    icon?: React.ReactNode
}

export default function UserDashboard() {
    const t = useTranslations("dashboard")
    const { data: session } = useSession()
    const [stats, setStats] = useState<QuickStat[]>([])
    const [activities, setActivities] = useState<RecentActivity[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/user/dashboard")
            const data = await res.json()

            if (data.success) {
                setStats([
                    {
                        label: t("stats.documents"),
                        value: data.stats.totalDocuments || 0,
                        change: t("stats.change_week", { count: 2 }),
                        icon: <FileText className="w-5 h-5" />,
                        color: "text-blue-600"
                    },
                    {
                        label: t("stats.queries"),
                        value: data.stats.totalQueries || 0,
                        change: t("stats.change_today", { count: 5 }),
                        icon: <Search className="w-5 h-5" />,
                        color: "text-teal-600"
                    },
                    {
                        label: t("stats.accuracy"),
                        value: `${data.stats.accuracyRate || 94}%`,
                        change: t("stats.change_month", { percent: 2 }),
                        icon: <CheckCircle2 className="w-5 h-5" />,
                        color: "text-emerald-600"
                    },
                    {
                        label: t("stats.time"),
                        value: `${data.stats.avgResponseTime || 2.3}s`,
                        change: t("stats.change_faster", { time: 0.5 }),
                        icon: <Zap className="w-5 h-5" />,
                        color: "text-amber-600"
                    }
                ])

                setActivities(data.activities || [])
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error)
            toast.error("No pudimos cargar tus datos. Intenta de nuevo.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <PageContainer>
            <PageHeader
                title={t("welcome", { name: session?.user?.name?.split(' ')[0] || "Usuario" })}
                subtitle={t("subtitle")}
            />

            <InlineHelpPanel
                contextIds={["upload-documents", "search-query"]}
                variant="compact"
                dismissible
            />

            <div
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                data-tour="quick-actions"
            >
                <ActionCard
                    data-tour="upload-action"
                    icon={<Upload className="w-8 h-8" />}
                    title={t("actions.upload.title")}
                    description={t("actions.upload.desc")}
                    href="/admin/knowledge-assets"
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                    accentColor="bg-blue-50 dark:bg-blue-900/20"
                    helpContext="upload-documents"
                />

                <ActionCard
                    data-tour="search-action"
                    icon={<Search className="w-8 h-8" />}
                    title={t("actions.search.title")}
                    description={t("actions.search.desc")}
                    href="/search"
                    color="bg-gradient-to-br from-teal-500 to-teal-600"
                    accentColor="bg-teal-50 dark:bg-teal-900/20"
                    highlighted
                    helpContext="search-query"
                />

                <ActionCard
                    data-tour="history-action"
                    icon={<History className="w-8 h-8" />}
                    title={t("actions.history.title")}
                    description={t("actions.history.desc")}
                    href="/admin/audit"
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                    accentColor="bg-purple-50 dark:bg-purple-900/20"
                    helpContext="history-function"
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <ContentCard key={i} className="p-6 animate-pulse">
                            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3" />
                            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        </ContentCard>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, i) => (
                        <ContentCard key={i} className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className={cn("p-3 rounded-2xl bg-slate-50 dark:bg-slate-800", stat.color)}>
                                    {stat.icon}
                                </div>
                                {stat.change && (
                                    <Badge variant="secondary" className="text-[10px] font-bold">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        {stat.change}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">
                                {stat.label}
                            </p>
                            <p className="text-3xl font-black text-foreground tabular-nums">
                                {stat.value}
                            </p>
                        </ContentCard>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ContentCard
                    title={t("sections.activity")}
                    icon={<Clock className="w-5 h-5" />}
                    className="lg:col-span-2"
                >
                    <div className="space-y-3">
                        {activities.length === 0 ? (
                            <EmptyState
                                icon={<Sparkles className="w-12 h-12 text-slate-300" />}
                                title={t("empty.title")}
                                description={t("empty.desc")}
                            />
                        ) : (
                            activities.slice(0, 5).map((activity) => (
                                <ActivityItem key={activity.id} activity={activity} />
                            ))
                        )}
                    </div>
                    {activities.length > 0 && (
                        <Link href="/admin/audit" className="block mt-4">
                            <Button variant="ghost" className="w-full">
                                {t("sections.view_all")}
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    )}
                </ContentCard>

                <ContentCard
                    title={
                        <div className="flex items-center gap-2">
                            <span>{t("sections.help")}</span>
                            <HelpButton
                                contextId="contact-support"
                                size="sm"
                                variant="icon"
                            />
                        </div>
                    }
                    icon={<HelpCircle className="w-5 h-5" />}
                >
                    <div className="space-y-3">
                        <HelpLink
                            title={t("help.upload.title")}
                            description={t("help.upload.desc")}
                            href="/admin/knowledge-assets"
                            helpContext="upload-documents"
                        />
                        <HelpLink
                            title={t("help.search.title")}
                            description={t("help.search.desc")}
                            href="/search"
                            helpContext="search-query"
                        />
                    </div>
                    <Link href="/admin/support" className="block mt-6">
                        <Button variant="outline" className="w-full">
                            {t("sections.contact")}
                        </Button>
                    </Link>
                </ContentCard>
            </div>
        </PageContainer>
    )
}

// ============ SUBCOMPONENTS ============

interface ActionCardProps {
    icon: React.ReactNode
    title: string
    description: string
    href: string
    color: string
    accentColor: string
    highlighted?: boolean
    helpContext?: string
    ["data-tour"]?: string
}

function ActionCard({
    icon,
    title,
    description,
    href,
    accentColor,
    highlighted,
    helpContext,
    "data-tour": dataTour
}: ActionCardProps) {
    return (
        <Link href={href}>
            <div
                className={cn(
                    "group relative p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer h-full overflow-hidden",
                    "hover:shadow-2xl hover:-translate-y-1",
                    highlighted
                        ? "border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950 dark:to-slate-900"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                )}
                data-tour={dataTour}
            >
                <div className="relative z-10">
                    <div className="flex items-start gap-3 mb-4">
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                            accentColor
                        )}>
                            <div className={cn("transition-colors", highlighted ? "text-teal-600" : "text-slate-600")}>
                                {icon}
                            </div>
                        </div>
                        {helpContext && (
                            <div className="mt-2">
                                <HelpButton
                                    contextId={helpContext}
                                    size="sm"
                                    variant="icon"
                                    position="bottom"
                                />
                            </div>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-teal-600 transition-colors">
                        {title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>

                    {highlighted && (
                        <Badge className="mt-4 bg-teal-600 text-white border-none">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Más usado
                        </Badge>
                    )}
                </div>

                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                    <ArrowRight className="w-6 h-6 text-teal-600" />
                </div>
            </div>
        </Link>
    )
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
    const t = useTranslations("common.activities")
    const icons = {
        upload: <FileText className="w-4 h-4 text-blue-500" />,
        search: <Search className="w-4 h-4 text-teal-500" />,
        success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    }

    const title = activity.type ? t(`${activity.type}.title`) : t("system")
    const description = activity.message || (activity.type ? t(`${activity.type}.desc`) : t("system"))

    return (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="mt-0.5">
                {icons[activity.type] || <Clock className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {title}
                </p>
                <p className="text-xs text-slate-500 truncate">
                    {description}
                </p>
            </div>
            <div className="text-[10px] text-slate-400 whitespace-nowrap pt-1">
                {new Date(activity.timestamp).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
        </div>
    )
}

function HelpLink({ title, description, href, helpContext }: { title: string, description: string, href: string, helpContext?: string }) {
    return (
        <Link href={href}>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-teal-200 dark:hover:border-teal-800 transition-all group cursor-pointer">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground mb-1 group-hover:text-teal-600 transition-colors">
                                {title}
                            </p>
                            {helpContext && (
                                <HelpButton
                                    contextId={helpContext}
                                    size="sm"
                                    variant="icon"
                                    position="top"
                                />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>
            </div>
        </Link>
    )
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 opacity-50">
                {icon}
            </div>
            <p className="font-bold text-foreground mb-2">{title}</p>
            <p className="text-sm text-muted-foreground max-w-xs">
                {description}
            </p>
        </div>
    )
}
