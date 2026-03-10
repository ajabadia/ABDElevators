import {
    type LucideIcon,
    LayoutDashboard,
    Zap,
    LifeBuoy,
    Shield,
    FileText,
    Search,
    Share2,
    GitBranch,
    CheckSquare,
    Terminal,
    Settings,
    Building,
    Users,
    CreditCard,
    Key,
    History,
    Scale,
    Activity,
    TrendingUp,
    ShieldCheck,
    Bell,
    UserCircle,
    BrainCircuit,
    ShieldAlert,
    Languages,
    Box
} from 'lucide-react';
import { UserRole } from '@/types/roles';

import { AppId } from '@/lib/app-registry';

export interface MenuItem {
    name: string;
    nameKey: string; // Key for next-intl
    href: string;
    icon: LucideIcon;
    roles?: UserRole[];
    module?: string;
    resource?: string; // Resource for Guardian ABAC
    action?: string;   // Action for Guardian ABAC
    requiresExpertMode?: boolean;
}

export interface MenuSection {
    label: string;
    labelKey: string; // Key for next-intl
    appId: AppId | 'ALL';
    items: MenuItem[];
    requiresExpertMode?: boolean;
}

export const menuSections: MenuSection[] = [
    {
        label: 'AI Hub',
        labelKey: 'sections.ai_hub',
        appId: AppId.TECHNICAL,
        requiresExpertMode: true,
        items: [
            {
                name: 'AI Hub Console',
                nameKey: 'items.aiHub',
                href: '/agents',
                icon: BrainCircuit,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                resource: 'admin:ai',
                action: 'read'
            },
            {
                name: 'Semantic Map',
                nameKey: 'items.graph',
                href: '/agents/graph',
                icon: Share2,
                roles: [UserRole.ADMIN, UserRole.TECHNICAL, UserRole.SUPER_ADMIN],
                resource: 'knowledge:graph',
                action: 'read'
            },
            {
                name: 'Prompt Engineering',
                nameKey: 'items.prompts',
                href: '/agents/prompts',
                icon: Terminal,
                roles: [UserRole.SUPER_ADMIN],
                resource: 'admin:prompts',
                action: 'manage',
                requiresExpertMode: true
            }
        ]
    },
    {
        label: 'Búsqueda',
        labelKey: 'sections.search',
        appId: AppId.SEARCH,
        items: [
            {
                name: 'Búsqueda Inteligente',
                nameKey: 'items.search',
                href: '/search',
                icon: Search
            }
        ]
    },
    {
        label: 'Operaciones',
        labelKey: 'sections.operations',
        appId: AppId.OPERATIONS,
        items: [
            {
                name: 'Dashboard',
                nameKey: 'items.dashboard',
                href: '/admin-dashboard',
                icon: LayoutDashboard
            },
            {
                name: `Technical Entities`,
                nameKey: 'items.entities',
                href: '/entities',
                icon: Zap,
                roles: [UserRole.ADMIN, UserRole.TECHNICAL],
                module: 'TECHNICAL',
                resource: 'entities',
                action: 'read'
            }
        ]
    },
    {
        label: 'Knowledge Hub',
        labelKey: 'sections.knowledge_hub',
        appId: AppId.KNOWLEDGE,
        items: [
            {
                name: 'Knowledge Hub',
                nameKey: 'items.knowledgeHub',
                href: '/intelligence',
                icon: FileText,
                roles: [UserRole.USER, UserRole.ADMIN, UserRole.ENGINEERING, UserRole.SUPER_ADMIN],
                resource: 'knowledge',
                action: 'read'
            },
            {
                name: 'Explorer',
                nameKey: 'items.explorer',
                href: '/intelligence/explorer',
                icon: Search,
                roles: [UserRole.ADMIN, UserRole.ENGINEERING, UserRole.SUPER_ADMIN],
                resource: 'knowledge:explorer',
                action: 'read'
            },
            {
                name: 'Document Types',
                nameKey: 'items.docTypes',
                href: '/intelligence/document-types',
                icon: Box,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                resource: 'knowledge:types',
                action: 'read'
            }
        ]
    },
    {
        label: 'Gestion de Tareas',
        labelKey: 'sections.tasks',
        appId: AppId.TASKS,
        items: [
            {
                name: 'Workflow Tasks',
                nameKey: 'items.workflow_tasks',
                href: '/work/tasks',
                icon: CheckSquare,
                roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMPLIANCE, UserRole.REVIEWER, UserRole.USER],
                resource: 'workflows:tasks',
                action: 'read'
            },
            {
                name: 'Checklist Configs',
                nameKey: 'items.checklists',
                href: '/work/checklists',
                icon: CheckSquare,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                resource: 'checklists',
                action: 'manage',
                requiresExpertMode: true
            }
        ]
    },
    {
        label: 'Organization',
        labelKey: 'sections.organization',
        appId: AppId.CONFIG,
        items: [
            {
                name: 'Organizations',
                nameKey: 'items.organizations',
                href: '/settings/organization',
                icon: Building,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                resource: 'admin:organizations',
                action: 'manage'
            },
            {
                name: 'Users',
                nameKey: 'items.users',
                href: '/settings/organization/team',
                icon: Users,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                resource: 'admin:users',
                action: 'manage'
            },
            {
                name: 'Billing & Subscriptions',
                nameKey: 'items.billing',
                href: '/settings/organization/billing',
                icon: CreditCard,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                resource: 'admin:billing',
                action: 'manage',
                requiresExpertMode: true
            },
            {
                name: 'API Keys',
                nameKey: 'items.apiKeys',
                href: '/settings/organization/api-keys',
                icon: Key,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                resource: 'admin:api-keys',
                action: 'manage',
                requiresExpertMode: true
            },
            {
                name: 'Audit Trail',
                nameKey: 'items.audit',
                href: '/insights/audit',
                icon: History,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                resource: 'admin:audit',
                action: 'read'
            },
            {
                name: 'Compliance',
                nameKey: 'items.compliance',
                href: '/insights/compliance',
                icon: Scale,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                resource: 'admin:compliance',
                action: 'read',
                requiresExpertMode: true
            }
        ]
    },
    {
        label: 'My Space',
        labelKey: 'sections.personal',
        appId: AppId.PERSONAL,
        items: [
            {
                name: 'My Documents',
                nameKey: 'items.documents',
                href: '/intelligence/my-docs',
                icon: Shield
            },
            {
                name: 'Spaces',
                nameKey: 'items.spaces',
                href: '/intelligence/spaces',
                icon: Box
            },
            {
                name: 'Technical Support',
                nameKey: 'items.support',
                href: '/support',
                icon: LifeBuoy
            }
        ]
    },
    {
        label: 'System & Preferences',
        labelKey: 'sections.preference',
        appId: AppId.CONFIG,
        items: [
            {
                name: 'Guardian Console',
                nameKey: 'items.governance_console',
                href: '/settings/permissions',
                icon: ShieldAlert,
                roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
                resource: 'admin:permissions',
                action: 'manage',
                requiresExpertMode: true
            },
            {
                name: 'Platform Hub',
                nameKey: 'items.superadmin',
                href: '/admin-dashboard',
                icon: Activity,
                roles: [UserRole.SUPER_ADMIN],
                resource: 'admin:superadmin',
                action: 'access'
            },
            {
                name: 'i18n Governance',
                nameKey: 'items.i18n',
                href: '/settings/system/i18n',
                icon: Languages,
                roles: [UserRole.SUPER_ADMIN],
                resource: 'admin:i18n',
                action: 'manage',
                requiresExpertMode: true
            },
            {
                name: 'Profile',
                nameKey: 'items.profile',
                href: '/settings/profile',
                icon: UserCircle
            },
            {
                name: 'Settings',
                nameKey: 'items.settings',
                href: '/settings',
                icon: Settings
            }
        ]
    },
    {
        label: 'Laboratory',
        labelKey: 'sections.labs',
        appId: 'ALL',
        requiresExpertMode: true,
        items: [
            {
                name: 'Experimental Labs',
                nameKey: 'items.labs',
                href: '/admin/labs',
                icon: Box,
                roles: [UserRole.SUPER_ADMIN],
                resource: 'admin:labs',
                action: 'read'
            }
        ]
    }
];
