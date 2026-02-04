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
    ShieldAlert
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
                name: 'Knowledge Assets',
                nameKey: 'items.assets',
                href: '/admin/knowledge-assets',
                icon: FileText,
                roles: [UserRole.ADMIN, UserRole.ENGINEERING],
                module: 'RAG'
            },
            {
                name: 'Search Explorer',
                nameKey: 'items.explorer',
                href: '/admin/knowledge-base',
                icon: Search,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
                module: 'RAG'
            },
            {
                name: 'Semantic Map',
                nameKey: 'items.graph',
                href: '/graphs',
                icon: Share2,
                roles: [UserRole.ADMIN, UserRole.TECHNICAL],
                module: 'TECHNICAL'
            }
        ]
    },
    {
        label: 'Engineering Studio',
        labelKey: 'sections.studio',
        items: [
            {
                name: 'Workflows',
                nameKey: 'items.workflows',
                href: '/admin/workflows',
                icon: GitBranch,
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
                name: 'RAG Quality',
                nameKey: 'items.quality',
                href: '/admin/rag-quality',
                icon: ShieldCheck,
                roles: [UserRole.SUPER_ADMIN],
                module: 'RAG'
            },
            {
                name: 'Active Intelligence',
                nameKey: 'items.intelligence',
                href: '/admin/intelligence/trends',
                icon: BrainCircuit,
                roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
                module: 'RAG'
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
            }
        ]
    }
];
