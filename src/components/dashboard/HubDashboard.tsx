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

interface HubCardProps {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    roles?: UserRole[];
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
    const coreCards: HubCardProps[] = [
        {
            id: "tasks",
            title: t("cards.tasks.title"), // "Mis Tareas"
            description: t("cards.tasks.description"), // "Gestiona tus tareas pendientes y flujos de trabajo asignados."
            href: "/admin/workflow-tasks",
            icon: <CheckSquare className="w-6 h-6" />,
            color: "border-l-primary",
            roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMPLIANCE, UserRole.REVIEWER, UserRole.TECHNICAL]
        },
        {
            id: "knowledge",
            title: t("cards.knowledge.title"), // "Knowledge Hub"
            description: t("cards.knowledge.description"), // "Accede a la base de conocimiento y documentación técnica."
            href: "/admin/knowledge",
            icon: <FileText className="w-6 h-6" />,
            color: "border-l-secondary",
            roles: [UserRole.ADMIN, UserRole.ENGINEERING, UserRole.SUPER_ADMIN, UserRole.TECHNICAL]
        },
        {
            id: "search",
            title: t("cards.search.title"), // "Búsqueda Inteligente"
            description: t("cards.search.description"), // "Busca información en toda la plataforma con IA."
            href: "/search",
            icon: <Search className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: "spaces",
            title: t("cards.spaces.title"), // "Espacios de Trabajo"
            description: t("cards.spaces.description"), // "Gestiona tus proyectos y espacios colaborativos."
            href: "/spaces",
            icon: <Box className="w-6 h-6" />,
            color: "border-l-muted"
        }
    ];

    // 2. Administration Modules (Admin/SuperAdmin)
    const adminCards: HubCardProps[] = [
        {
            id: "organizations",
            title: t("cards.organizations.title"),
            description: t("cards.organizations.description"),
            href: "/admin/organizations",
            icon: <Building className="w-6 h-6" />,
            color: "border-l-primary",
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        },
        {
            id: "users",
            title: t("cards.users.title"),
            description: t("cards.users.description"),
            href: "/admin/users",
            icon: <Users className="w-6 h-6" />,
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
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        },
        {
            id: "checklist_config",
            title: t("cards.checklist_config.title"),
            description: t("cards.checklist_config.description"),
            href: "/admin/checklist-configs",
            icon: <CheckSquare className="w-6 h-6" />, // Same icon as tasks, maybe different?
            color: "border-l-muted",
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        }
    ];

    // 3. Advanced / System Modules (Collapsible)
    const systemCards: HubCardProps[] = [
        {
            id: "audit",
            title: t("cards.audit.title"),
            description: t("cards.audit.description"),
            href: "/admin/audit",
            icon: <History className="w-6 h-6" />,
            color: "border-l-slate-400",
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        },
        {
            id: "guardian",
            title: t("cards.guardian.title"),
            description: t("cards.guardian.description"),
            href: "/admin/permissions",
            icon: <ShieldAlert className="w-6 h-6" />,
            color: "border-l-destructive",
            roles: [UserRole.SUPER_ADMIN]
        },
        {
            id: "i18n",
            title: t("cards.i18n.title"),
            description: t("cards.i18n.description"),
            href: "/admin/settings/i18n",
            icon: <Languages className="w-6 h-6" />,
            color: "border-l-indigo-400",
            roles: [UserRole.SUPER_ADMIN]
        },
        {
            id: "api_keys",
            title: t("cards.api_keys.title"),
            description: t("cards.api_keys.description"),
            href: "/admin/api-keys",
            icon: <Key className="w-6 h-6" />,
            color: "border-l-amber-400",
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        }
    ];

    // Filter cards
    const visibleCore = coreCards.filter(c => isVisible(c.roles));
    const visibleAdmin = adminCards.filter(c => isVisible(c.roles));
    const visibleSystem = systemCards.filter(c => isVisible(c.roles));

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
