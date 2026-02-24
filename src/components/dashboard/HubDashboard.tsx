"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LayoutDashboard,
    Search,
    BrainCircuit,
    Share2,
    Terminal,
    Zap,
    FileText,
    CheckSquare,
    Building,
    Users,
    CreditCard,
    Key,
    History,
    Scale,
    Shield,
    Box,
    LifeBuoy,
    ShieldAlert,
    Languages,
    UserCircle,
    Settings,
    ArrowRight,
    ChevronRight,
    Briefcase,
    Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/roles";
import { useState } from "react";
import { PersonalOverview } from "@/components/dashboard/PersonalOverview";
import { useApiItem } from "@/hooks/useApiItem";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

import { APP_REGISTRY, AppId } from "@/lib/app-registry";

interface HubCardProps {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    roles?: UserRole[];
    inactive?: boolean;
}

export default function HubDashboard() {
    const { data: session } = useSession();
    const t = useTranslations("dashboard.hub");
    const router = useRouter();
    const userRole = session?.user?.role as UserRole;
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    // Determines if a card should be visible based on user role
    const isVisible = (roles?: UserRole[]) => {
        if (!roles) return true;
        if (!userRole) return false;
        return roles.includes(userRole);
    };

    // 1. Core Modules (Visible to almost everyone active)

    const TasksIcon = APP_REGISTRY[AppId.TASKS].icon;
    const KnowledgeIcon = APP_REGISTRY[AppId.KNOWLEDGE].icon;
    const SearchIcon = APP_REGISTRY[AppId.SEARCH].icon;
    const PersonalIcon = APP_REGISTRY[AppId.PERSONAL].icon;

    const coreCards: HubCardProps[] = [
        {
            id: "tasks",
            title: t("cards.tasks.title"),
            description: t("cards.tasks.description"),
            href: APP_REGISTRY[AppId.TASKS].basePath,
            icon: <TasksIcon className="w-6 h-6" />,
            color: "border-l-primary",
            roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMPLIANCE, UserRole.REVIEWER, UserRole.TECHNICAL]
        },
        {
            id: "knowledge",
            title: t("cards.knowledge.title"),
            description: t("cards.knowledge.description"),
            href: APP_REGISTRY[AppId.KNOWLEDGE].basePath,
            icon: <KnowledgeIcon className="w-6 h-6" />,
            color: "border-l-secondary",
            roles: [UserRole.ADMIN, UserRole.ENGINEERING, UserRole.SUPER_ADMIN, UserRole.TECHNICAL]
        },
        {
            id: "search",
            title: t("cards.search.title"),
            description: t("cards.search.description"),
            href: APP_REGISTRY[AppId.SEARCH].basePath,
            icon: <SearchIcon className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: "spaces",
            title: t("cards.spaces.title"),
            description: t("cards.spaces.description"),
            href: APP_REGISTRY[AppId.PERSONAL].basePath,
            icon: <PersonalIcon className="w-6 h-6" />,
            color: "border-l-muted",
            inactive: true
        }
    ];

    // 2. Administration Modules (Admin/SuperAdmin)
    const OrgIcon = APP_REGISTRY[AppId.ORGANIZATIONS].icon;
    const UsersIcon = APP_REGISTRY[AppId.USERS].icon;

    const adminCards: HubCardProps[] = [
        {
            id: "organizations",
            title: t("cards.organizations.title"),
            description: t("cards.organizations.description"),
            href: APP_REGISTRY[AppId.ORGANIZATIONS].basePath,
            icon: <OrgIcon className="w-6 h-6" />,
            color: "border-l-primary",
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        },
        {
            id: "users",
            title: t("cards.users.title"),
            description: t("cards.users.description"),
            href: APP_REGISTRY[AppId.USERS].basePath,
            icon: <UsersIcon className="w-6 h-6" />,
            color: "border-l-secondary",
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        },
        {
            id: "ai_console",
            title: t("cards.ai_console.title"),
            description: t("cards.ai_console.description"),
            href: "/admin/ai",
            icon: <BrainCircuit className="w-6 h-6" />,
            color: "border-l-accent",
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
            inactive: true // Technical placeholder
        },
        {
            id: "checklist_config",
            title: t("cards.checklist_config.title"),
            description: t("cards.checklist_config.description"),
            href: "/admin/checklist-configs",
            icon: <CheckSquare className="w-6 h-6" />,
            color: "border-l-muted",
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        }
    ];

    // 3. Advanced / System Modules (Collapsible)
    const ConfigIcon = APP_REGISTRY[AppId.CONFIG].icon;

    const systemCards: HubCardProps[] = [
        {
            id: "audit",
            title: t("cards.audit.title"),
            description: t("cards.audit.description"),
            href: "/admin/audit",
            icon: <History className="w-6 h-6" />,
            color: "border-l-slate-400",
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
            inactive: true // Coming Soon
        },
        {
            id: "guardian",
            title: t("cards.guardian.title"),
            description: t("cards.guardian.description"),
            href: APP_REGISTRY[AppId.CONFIG].basePath,
            icon: <ConfigIcon className="w-6 h-6" />,
            color: "border-l-destructive",
            roles: [UserRole.SUPER_ADMIN],
            inactive: true // Coming Soon
        },
        {
            id: "i18n",
            title: t("cards.i18n.title"),
            description: t("cards.i18n.description"),
            href: "/admin/settings/i18n",
            icon: <Languages className="w-6 h-6" />,
            color: "border-l-indigo-400",
            roles: [UserRole.SUPER_ADMIN],
            inactive: true // Coming Soon
        },
        {
            id: "api_keys",
            title: t("cards.api_keys.title"),
            description: t("cards.api_keys.description"),
            href: "/admin/api-keys",
            icon: <Key className="w-6 h-6" />,
            color: "border-l-amber-400",
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
            inactive: true // Coming Soon
        }
    ];

    // Filter cards
    const visibleCore = coreCards.filter(c => isVisible(c.roles) && !c.inactive);
    const visibleAdmin = adminCards.filter(c => isVisible(c.roles) && !c.inactive);
    const visibleSystem = systemCards.filter(c => isVisible(c.roles) && !c.inactive);

    // Combine primary cards (Core + Admin)
    const primaryCards = [...visibleCore, ...visibleAdmin];

    return (
        <PageContainer className="animate-in fade-in duration-500">
            <PageHeader
                title={t("welcome_title", { name: session?.user?.name?.split(' ')[0] || "User" })}
                subtitle={t("welcome_subtitle")}
                icon={<LayoutDashboard className="w-6 h-6 text-primary" />}
            />

            {/* Personal Overview (Stats/Inbox) */}
            <PersonalOverview />

            {/* FASE 195.3: Attention Needed Panel */}
            <AttentionPanel />

            {/* Primary Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                {primaryCards.map((card) => (
                    <HubCard key={card.id} card={card} router={router} />
                ))}
            </div>

            {/* Advanced Section (if any visible) */}
            {visibleSystem.length > 0 && (
                <div className="mt-12">
                    <button
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group"
                    >
                        <ChevronRight className={cn("h-4 w-4 transition-transform group-hover:text-primary", isAdvancedOpen && "rotate-90")} />
                        {t("advanced_section")}
                    </button>

                    {isAdvancedOpen && (
                        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            {visibleSystem.map((card) => (
                                <HubCard key={card.id} card={card} router={router} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </PageContainer>
    );
}

function HubCard({ card, router }: { card: HubCardProps, router: any }) {
    return (
        <Card
            onClick={() => router.push(card.href)}
            className={cn(
                "group cursor-pointer border-l-4 hover:shadow-lg transition-all duration-300",
                "hover:scale-[1.02] relative overflow-hidden",
                card.color
            )}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {card.icon}
                        </div>
                        <CardTitle className="text-xl tracking-tight">
                            {card.title}
                        </CardTitle>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-sm leading-relaxed line-clamp-2">
                    {card.description}
                </CardDescription>
            </CardContent>
        </Card>
    );
}

function AttentionPanel() {
    const t = useTranslations("dashboard");
    const router = useRouter();
    const { data: valueData } = useApiItem<any>({
        endpoint: '/api/dashboard/value-metrics',
    });

    const items = valueData?.attentionItems || [];

    if (items.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                    {t("stats.attention")}
                </h3>
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px] rounded-full">
                    {items.length}
                </Badge>
            </div>

            <div className="grid gap-3">
                {items.map((item: any, i: number) => (
                    <button
                        key={i}
                        onClick={() => router.push(item.href)}
                        className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary/50 transition-all group text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                            <div>
                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                    {item.label}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                                    Esfuerzo estimado: {item.estimate}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all" />
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
