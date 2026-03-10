import { UserRole } from '@/types/roles';
import {
    Briefcase,
    FileText,
    CheckCircle,
    CheckSquare,
    FolderOpen,
    Brain,
    Search,
    Compass,
    Network,
    Database,
    Globe,
    BarChart3,
    Bot,
    GitBranch,
    Terminal,
    Sparkles,
    Shield,
    BarChart2,
    TrendingUp,
    Settings,
    User,
    Building2,
    Lock,
    Server,
    Globe2,
    Bell,
    ListTodo,
    Gavel,
    ClipboardCheck,
    ShieldCheck,
    Hammer,
    Activity,
    LayoutGrid,
    GitFork,
    Clock,
    ClipboardList,
    BrainCircuit,
    ShieldAlert,
    UserCog,
    HardDrive,
    History,
    Calendar
} from 'lucide-react';

export interface NavItem {
    id: string;
    labelKey: string;
    descriptionKey?: string;
    href: string;
    icon: any; // Lucide icon component
    minRole?: UserRole;
    children?: NavItem[];
    featured?: boolean;
    resource?: string; // For ABAC
    action?: string;   // For ABAC
}

export interface NavSection {
    id: string;
    labelKey: string;
    icon: any; // Lucide icon component
    minRole?: UserRole;
    items: NavItem[];
    resource?: string; // For ABAC
}

export const NAVIGATION_CONFIG: NavSection[] = [
    {
        id: 'work',
        labelKey: 'nav.work.label',
        icon: Briefcase,
        minRole: UserRole.USER,
        items: [
            {
                id: 'work-hub',
                labelKey: 'nav.work.label',
                href: '/work',
                icon: LayoutGrid,
                featured: true,
            },
            {
                id: 'orders',
                labelKey: 'nav.work.orders',
                href: '/work/orders',
                icon: Briefcase,
                minRole: UserRole.TECHNICAL,
                children: [
                    { id: 'orders_list', labelKey: 'nav.work.orders', href: '/work/orders', icon: ListTodo },
                    { id: 'orders_new', labelKey: 'technical.entities.newAnalysis', href: '/work/orders', icon: Sparkles },
                ]
            },
            {
                id: 'cases',
                labelKey: 'nav.work.cases',
                href: '/work/cases',
                icon: Gavel,
                minRole: UserRole.TECHNICAL,
                children: [
                    { id: 'cases_all', labelKey: 'cases.hub.all.title', href: '/work/cases/all', icon: Briefcase },
                    { id: 'cases_active', labelKey: 'cases.hub.active.title', href: '/work/cases/active', icon: ShieldCheck },
                ]
            },
            {
                id: 'tasks',
                labelKey: 'nav.work.tasks',
                href: '/tasks',
                icon: ListTodo,
                minRole: UserRole.USER,
            },
            {
                id: 'checklists',
                labelKey: 'nav.work.checklists',
                href: '/work/checklists',
                icon: ClipboardCheck,
                minRole: UserRole.TECHNICAL,
            },
            {
                id: 'workshop',
                labelKey: 'nav.work.workshop',
                href: '/work/workshop',
                icon: Hammer,
                minRole: UserRole.TECHNICAL,
            },
            {
                id: 'documents',
                labelKey: 'nav.work.documents',
                href: '/intelligence/my-docs',
                icon: FolderOpen,
                minRole: UserRole.USER,
            },
        ],
    },
    {
        id: 'intelligence',
        labelKey: 'nav.intelligence.label',
        icon: Brain,
        minRole: UserRole.TECHNICAL,
        items: [
            {
                id: 'search',
                labelKey: 'nav.intelligence.search',
                href: '/search',
                icon: Search,
                descriptionKey: 'nav.intelligence.search_desc',
                featured: true,
            },
            {
                id: 'knowledge-hub',
                labelKey: 'nav.intelligence.label',
                href: '/intelligence',
                icon: BrainCircuit,
                children: [
                    { id: 'explorer', labelKey: 'nav.intelligence.explorer', href: '/intelligence/explorer', icon: BrainCircuit, minRole: UserRole.TECHNICAL },
                    { id: 'assets', labelKey: 'nav.intelligence.assets', href: '/intelligence/assets', icon: FileText, minRole: UserRole.ADMIN },
                    { id: 'my_docs', labelKey: 'nav.intelligence.my_docs', href: '/intelligence/my-docs', icon: FolderOpen, minRole: UserRole.USER },
                    { id: 'document_types', labelKey: 'nav.intelligence.document_types', href: '/intelligence/document-types', icon: FileText, minRole: UserRole.ADMIN },
                    { id: 'spaces', labelKey: 'nav.intelligence.spaces', href: '/intelligence/spaces', icon: Globe, minRole: UserRole.ADMIN },
                    { id: 'graph', labelKey: 'nav.intelligence.graph', href: '/intelligence/graph', icon: Network, minRole: UserRole.TECHNICAL },
                ]
            }
        ],
    },
    {
        id: 'agents',
        labelKey: 'nav.agents.label',
        icon: Bot,
        minRole: UserRole.TECHNICAL,
        items: [
            {
                id: 'ai-hub',
                labelKey: 'nav.agents.label',
                href: '/agents',
                icon: Sparkles,
                children: [
                    { id: 'workflows', labelKey: 'nav.agents.workflows', href: '/agents/workflows', icon: GitFork, minRole: UserRole.TECHNICAL },
                    { id: 'prompts', labelKey: 'nav.agents.prompts', href: '/agents/prompts', icon: Terminal, minRole: UserRole.TECHNICAL },
                    { id: 'playground', labelKey: 'nav.agents.playground', href: '/agents/playground', icon: Sparkles, minRole: UserRole.TECHNICAL },
                    { id: 'governance', labelKey: 'nav.agents.governance', href: '/agents/governance', icon: Shield, minRole: UserRole.SUPER_ADMIN },
                    { id: 'rag_quality', labelKey: 'nav.agents.rag_quality', href: '/agents/rag-quality', icon: Activity, minRole: UserRole.ADMIN },
                    { id: 'golden_sets', labelKey: 'nav.agents.golden_sets', href: '/agents/golden-sets', icon: ShieldAlert, minRole: UserRole.ADMIN },
                    { id: 'agent_builder', labelKey: 'nav.agents.agent_builder', href: '/agents/agents', icon: Bot, minRole: UserRole.SUPER_ADMIN },
                ]
            },
        ],
    },
    {
        id: 'insights',
        labelKey: 'nav.insights.label',
        icon: BarChart2,
        minRole: UserRole.ADMIN,
        items: [
            {
                id: 'insights-hub',
                labelKey: 'nav.insights.label',
                href: '/insights',
                icon: BarChart3,
                children: [
                    { id: 'analytics', labelKey: 'nav.insights.analytics', href: '/insights/analytics', icon: TrendingUp, minRole: UserRole.ADMIN },
                    { id: 'reports', labelKey: 'nav.insights.reports', href: '/insights/reports', icon: FileText, minRole: UserRole.ADMIN },
                    { id: 'scheduled', labelKey: 'nav.insights.scheduled', href: '/insights/scheduled', icon: Clock, minRole: UserRole.USER },
                    { id: 'audit', labelKey: 'nav.insights.audit', href: '/insights/audit', icon: ShieldCheck, minRole: UserRole.SUPER_ADMIN },
                    { id: 'compliance', labelKey: 'nav.insights.compliance', href: '/insights/compliance', icon: ClipboardList, minRole: UserRole.ADMIN },
                ]
            },
        ],
    },
    {
        id: 'settings',
        labelKey: 'nav.settings.label',
        icon: Settings,
        minRole: UserRole.USER,
        items: [
            {
                id: 'profile',
                labelKey: 'nav.settings.profile',
                href: '/settings/profile',
                icon: User,
            },
            {
                id: 'organization',
                labelKey: 'nav.settings.organization',
                href: '/settings/organization',
                icon: Building2,
                minRole: UserRole.ADMIN,
            },
            {
                id: 'permissions',
                labelKey: 'nav.settings.permissions',
                href: '/settings/permissions',
                icon: Lock,
                minRole: UserRole.ADMIN,
            },
            {
                id: 'system',
                labelKey: 'nav.settings.system',
                href: '/settings/system',
                icon: Server,
                minRole: UserRole.SUPER_ADMIN,
                children: [
                    {
                        id: 'i18n',
                        labelKey: 'nav.settings.i18n',
                        href: '/settings/system/i18n',
                        icon: Globe,
                    },
                    {
                        id: 'notifications',
                        labelKey: 'nav.settings.notifications',
                        href: '/settings/system/notifications',
                        icon: Bell,
                    },
                    {
                        id: 'operations',
                        labelKey: 'nav.settings.operations',
                        href: '/settings/system/operations',
                        icon: Hammer,
                    },
                ]
            },
            {
                id: 'superadmin',
                labelKey: 'nav.settings.superadmin',
                href: '/settings/superadmin',
                icon: UserCog,
                minRole: UserRole.SUPER_ADMIN,
            }
        ],
    },
    {
        id: 'help',
        labelKey: 'nav.help.label',
        icon: Database, // Fixed for help
        minRole: UserRole.USER,
        items: [
            {
                id: 'docs',
                labelKey: 'nav.help.docs',
                href: '/help/docs',
                icon: FileText,
            },
            {
                id: 'support',
                labelKey: 'nav.help.support',
                href: '/help/support',
                icon: Shield,
            },
        ]
    }
];

/**
 * Filters the navigation configuration based on the user's role weight.
 */
export function filterNavigationByRole(config: NavSection[], role?: UserRole): NavSection[] {
    const getRoleWeight = (r?: UserRole) => {
        if (!r) return 0;
        switch (r) {
            case UserRole.SUPER_ADMIN: return 100;
            case UserRole.ADMIN: return 80;
            case UserRole.TECHNICAL: return 60;
            // case UserRole.OPS: return 40; // Removed as it doesn't exist in @abd/platform-core
            case UserRole.USER: return 20;
            default: return 0;
        }
    };

    const userWeight = getRoleWeight(role);

    return config
        .filter(section => getRoleWeight(section.minRole) <= userWeight)
        .map(section => ({
            ...section,
            items: section.items
                .filter(item => getRoleWeight(item.minRole) <= userWeight)
                .map(item => ({
                    ...item,
                    children: item.children?.filter(child => getRoleWeight(child.minRole) <= userWeight)
                }))
        }));
}
