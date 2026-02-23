import {
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
    icon: any;
    roles?: UserRole[];
    module?: string;
}

export interface MenuSection {
    label: string;
    labelKey: string; // Key for next-intl
    appId: AppId | 'ALL';
    items: MenuItem[];
}

export const menuSections: MenuSection[] = [
    {
        label: 'AI Hub',
        labelKey: 'sections.ai_hub',
        appId: AppId.TECHNICAL,
        items: [
            {
                name: 'Búsqueda Inteligente',
                nameKey: 'items.search',
                href: '/search',
                icon: Search
            },
            {
                name: 'AI Hub Console',
                nameKey: 'items.aiHub',
                href: '/admin/ai',
                icon: BrainCircuit,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Semantic Map',
                nameKey: 'items.graph',
                href: '/admin/knowledge-base/graph',
                icon: Share2,
                roles: [UserRole.ADMIN, UserRole.TECHNICAL, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Prompt Engineering',
                nameKey: 'items.prompts',
                href: '/admin/prompts',
                icon: Terminal,
                roles: [UserRole.SUPER_ADMIN]
            }
        ]
    },
    {
        label: 'Operations',
        labelKey: 'sections.operations',
        appId: AppId.OPERATIONS,
        items: [
            {
                name: 'Dashboard',
                nameKey: 'items.dashboard',
                href: '/admin',
                icon: LayoutDashboard
            },
            {
                name: `Technical Entities`,
                nameKey: 'items.entities',
                href: '/entities',
                icon: Zap,
                roles: [UserRole.ADMIN, UserRole.TECHNICAL],
                module: 'TECHNICAL'
            },
            {
                name: 'Knowledge Hub',
                nameKey: 'items.knowledgeHub',
                href: '/admin/knowledge',
                icon: FileText,
                roles: [UserRole.ADMIN, UserRole.ENGINEERING, UserRole.SUPER_ADMIN],
            },
            {
                name: 'Workflow Tasks',
                nameKey: 'items.workflow_tasks',
                href: '/admin/workflow-tasks',
                icon: CheckSquare,
                roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMPLIANCE, UserRole.REVIEWER]
            },
            {
                name: 'Checklist Configs',
                nameKey: 'items.checklists',
                href: '/admin/checklist-configs',
                icon: CheckSquare,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
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
                href: '/admin/organizations',
                icon: Building,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Users',
                nameKey: 'items.users',
                href: '/admin/users',
                icon: Users,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Billing & Subscriptions',
                nameKey: 'items.billing',
                href: '/admin/billing',
                icon: CreditCard,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'API Keys',
                nameKey: 'items.apiKeys',
                href: '/admin/api-keys',
                icon: Key,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Audit Trail',
                nameKey: 'items.audit',
                href: '/admin/audit',
                icon: History,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Compliance',
                nameKey: 'items.compliance',
                href: '/admin/compliance',
                icon: Scale,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
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
                href: '/admin/my-documents',
                icon: Shield
            },
            {
                name: 'Spaces',
                nameKey: 'items.spaces',
                href: '/spaces',
                icon: Box
            },
            {
                name: 'Technical Support',
                nameKey: 'items.support',
                href: '/admin/support',
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
                href: '/admin/permissions',
                icon: ShieldAlert,
                roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
            },
            {
                name: 'i18n Governance',
                nameKey: 'items.i18n',
                href: '/admin/settings/i18n',
                icon: Languages,
                roles: [UserRole.SUPER_ADMIN]
            },
            {
                name: 'Profile',
                nameKey: 'items.profile',
                href: '/admin/profile',
                icon: UserCircle
            },
            {
                name: 'Settings',
                nameKey: 'items.settings',
                href: '/settings',
                icon: Settings
            }
        ]
    }
];
