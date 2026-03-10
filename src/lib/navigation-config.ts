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
    Calendar,
    TrendingUp,
    History,
    Settings,
    User,
    Building2,
    Lock,
    Server,
    HelpCircle,
    BookOpen,
    Code,
    LifeBuoy,
    FlaskConical,
    LucideIcon
} from 'lucide-react';

export interface NavigationItem {
    id: string;
    labelKey: string;
    href: string;
    icon: LucideIcon;
    descriptionKey?: string;
    featured?: boolean;
    minRole?: UserRole;
    maxRole?: UserRole;
    roles?: UserRole[]; // explicit roles if needed
    resource?: string;  // For Guardian
    action?: string;    // For Guardian
    badge?: string;     // key to extract from a store/context
}

export interface NavigationSection {
    id: string;
    labelKey: string;
    icon: LucideIcon;
    minRole?: UserRole;
    maxRole?: UserRole;
    items: NavigationItem[];
}

export const NEW_NAVIGATION_CONFIG: NavigationSection[] = [
    {
        id: 'work',
        labelKey: 'nav.work.label',
        icon: Briefcase,
        minRole: UserRole.TECHNICAL,
        items: [
            {
                id: 'orders',
                labelKey: 'nav.work.orders',
                href: '/work/orders',
                icon: FileText,
                descriptionKey: 'nav.work.orders_desc',
            },
            {
                id: 'validations',
                labelKey: 'nav.work.validations',
                href: '/work/validations',
                icon: CheckCircle,
                badge: 'pendingValidationsCount',
            },
            {
                id: 'tasks',
                labelKey: 'nav.work.tasks',
                href: '/work/tasks_legacy',
                icon: CheckSquare,
            },
            {
                id: 'documents',
                labelKey: 'nav.work.documents',
                href: '/intelligence/my-docs',
                icon: FolderOpen,
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
                id: 'explorer',
                labelKey: 'nav.intelligence.explorer',
                href: '/intelligence/explorer',
                icon: Compass,
            },
            {
                id: 'graph',
                labelKey: 'nav.intelligence.graph',
                href: '/intelligence/graph',
                icon: Network,
            },
            {
                id: 'assets',
                labelKey: 'nav.intelligence.assets',
                href: '/intelligence/assets',
                icon: Database,
                minRole: UserRole.ADMIN,
            },
            {
                id: 'spaces',
                labelKey: 'nav.intelligence.spaces',
                href: '/intelligence/spaces',
                icon: Globe,
                minRole: UserRole.ADMIN,
            },
            {
                id: 'quality',
                labelKey: 'nav.intelligence.quality',
                href: '/agents/rag-quality',
                icon: BarChart3,
                minRole: UserRole.ADMIN,
            },
        ],
    },
    {
        id: 'agents',
        labelKey: 'nav.agents.label',
        icon: Bot,
        minRole: UserRole.ADMIN,
        items: [
            {
                id: 'workflows',
                labelKey: 'nav.agents.workflows',
                href: '/agents/workflows',
                icon: GitBranch,
            },
            {
                id: 'prompts',
                labelKey: 'nav.agents.prompts',
                href: '/agents/prompts_legacy',
                icon: Terminal,
            },
            {
                id: 'playground',
                labelKey: 'nav.agents.playground',
                href: '/agents/playground',
                icon: Sparkles,
            },
            {
                id: 'governance',
                labelKey: 'nav.agents.governance',
                href: '/agents/governance',
                icon: Shield,
                minRole: UserRole.SUPER_ADMIN,
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
                id: 'reports',
                labelKey: 'nav.insights.reports',
                href: '/insights/reports',
                icon: FileText,
            },
            {
                id: 'scheduled',
                labelKey: 'nav.insights.scheduled',
                href: '/insights/scheduled',
                icon: Calendar,
            },
            {
                id: 'analytics',
                labelKey: 'nav.insights.analytics',
                href: '/insights/analytics',
                icon: TrendingUp,
            },
            {
                id: 'audit',
                labelKey: 'nav.insights.audit',
                href: '/insights/audit',
                icon: History,
                minRole: UserRole.SUPER_ADMIN,
            },
        ],
    },
    {
        id: 'settings',
        labelKey: 'nav.settings.label',
        icon: Settings,
        minRole: UserRole.USER, // Because users have profile
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
            },
        ],
    },
    {
        id: 'help',
        labelKey: 'nav.help.label',
        icon: HelpCircle,
        minRole: UserRole.USER,
        items: [
            {
                id: 'docs',
                labelKey: 'nav.help.docs',
                href: '/help/support',
                icon: BookOpen,
            },
            {
                id: 'api',
                labelKey: 'nav.help.api',
                href: '/help/api',
                icon: Code,
                minRole: UserRole.ADMIN,
            },
            {
                id: 'support',
                labelKey: 'nav.help.support',
                href: '/help/support',
                icon: LifeBuoy,
            },
            {
                id: 'labs',
                labelKey: 'nav.help.labs',
                href: '/help/labs',
                icon: FlaskConical,
                minRole: UserRole.SUPER_ADMIN,
            },
        ],
    },
];

const roleWeights: Record<UserRole, number> = {
    [UserRole.USER]: 1,
    [UserRole.SUPPORT]: 2,
    [UserRole.TECHNICAL]: 3,
    [UserRole.REVIEWER]: 4,
    [UserRole.COMPLIANCE]: 5,
    [UserRole.ENGINEERING]: 6,
    [UserRole.ADMINISTRATIVE]: 7,
    [UserRole.ADMIN]: 8,
    [UserRole.SUPER_ADMIN]: 9,
};

export function filterNavigationByRole(config: NavigationSection[], userRole?: UserRole): NavigationSection[] {
    if (!userRole) return [];

    const userWeight = roleWeights[userRole] || 0;

    return config
        .map(section => {
            // Check section level roles
            const minSectionWeight = section.minRole ? roleWeights[section.minRole] : 0;
            const maxSectionWeight = section.maxRole ? roleWeights[section.maxRole] : 100;

            if (userWeight < minSectionWeight || userWeight > maxSectionWeight) {
                return null;
            }

            const filteredItems = section.items.filter(item => {
                // Explicit roles array takes precedence
                if (item.roles && item.roles.length > 0) {
                    return item.roles.includes(userRole);
                }

                const minItemWeight = item.minRole ? roleWeights[item.minRole] : 0;
                const maxItemWeight = item.maxRole ? roleWeights[item.maxRole] : 100;

                return userWeight >= minItemWeight && userWeight <= maxItemWeight;
            });

            if (filteredItems.length === 0) return null;

            return {
                ...section,
                items: filteredItems
            };
        })
        .filter(Boolean) as NavigationSection[];
}
