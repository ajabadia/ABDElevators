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
    items: MenuItem[];
}

export const menuSections: MenuSection[] = [
    {
        label: 'Core',
        labelKey: 'sections.core',
        items: [
            {
                name: 'Dashboard',
                nameKey: 'items.dashboard',
                href: '/admin', // Will be dynamic in component
                icon: LayoutDashboard
            },
            {
                name: 'Búsqueda Inteligente',
                nameKey: 'items.search',
                href: '/search',
                icon: Search
            },
            {
                name: 'My Files',
                nameKey: 'items.documents',
                href: '/admin/my-documents',
                icon: Shield
            },
            {
                name: 'Technical Support',
                nameKey: 'items.support',
                href: '/admin/support',
                icon: LifeBuoy,
                roles: [UserRole.TECHNICAL, UserRole.ENGINEERING]
            }
        ]
    },
    {
        label: 'Technical Inventory',
        labelKey: 'sections.inventory',
        items: [
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
                name: 'Semantic Map',
                nameKey: 'items.graph',
                href: '/admin/knowledge-base/graph',
                icon: Share2,
                roles: [UserRole.ADMIN, UserRole.TECHNICAL, UserRole.SUPER_ADMIN]
            }
        ]
    },
    {
        label: 'Automation Studio',
        labelKey: 'sections.studio',
        items: [
            {
                name: 'AI Hub',
                nameKey: 'items.aiHub',
                href: '/admin/ai',
                icon: BrainCircuit,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Checklist Configs',
                nameKey: 'items.checklists',
                href: '/admin/checklist-configs',
                icon: CheckSquare,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Prompts',
                nameKey: 'items.prompts',
                href: '/admin/prompts',
                icon: Terminal,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Document Types',
                nameKey: 'items.docTypes',
                href: '/admin/document-types',
                icon: Settings,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'i18n Governance',
                nameKey: 'items.i18n',
                href: '/admin/settings/i18n',
                icon: Languages,
                roles: [UserRole.SUPER_ADMIN]
            }
        ]
    },
    {
        label: 'Knowledge Workspace',
        labelKey: 'sections.workspace',
        items: [
            {
                name: 'Spaces',
                nameKey: 'items.spaces',
                href: '/spaces',
                icon: Box
            },
            {
                name: 'Admin Spaces',
                nameKey: 'items.admin_spaces',
                href: '/admin/spaces',
                icon: Shield,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            }
        ]
    },
    {
        label: 'Corporate & Admin',
        labelKey: 'sections.corporate',
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
                name: 'Billing',
                nameKey: 'items.billing',
                href: '/admin/billing',
                icon: CreditCard,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Contracts',
                nameKey: 'items.contracts',
                href: '/admin/billing/contracts',
                icon: FileText,
                roles: [UserRole.SUPER_ADMIN]
            },
            {
                name: 'API Keys',
                nameKey: 'items.apiKeys',
                href: '/admin/api-keys',
                icon: Key,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            }
        ]
    },
    {
        label: 'Governance & Systems',
        labelKey: 'sections.governance',
        items: [
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
            },
            {
                name: 'System Logs',
                nameKey: 'items.logs',
                href: '/admin/logs',
                icon: Activity,
                roles: [UserRole.SUPER_ADMIN]
            },
            {
                name: 'Global Analytics',
                nameKey: 'items.analytics',
                href: '/admin/analytics',
                icon: TrendingUp,
                roles: [UserRole.SUPER_ADMIN]
            },

            {
                name: 'Workflow Tasks',
                nameKey: 'items.workflow_tasks',
                href: '/admin/workflow-tasks',
                icon: CheckSquare,
                roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMPLIANCE, UserRole.REVIEWER]
            },
            {
                name: 'Guardian Console',
                nameKey: 'items.governance_console',
                href: '/admin/permissions',
                icon: ShieldAlert,
                roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
            }
        ]
    },
    {
        label: 'Preference',
        labelKey: 'sections.preference',
        items: [
            {
                name: 'Notifications',
                nameKey: 'items.notifications',
                href: '/admin/notifications',
                icon: Bell,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            },
            {
                name: 'Support',
                nameKey: 'items.support',
                href: '/admin/support',
                icon: LifeBuoy,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
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
