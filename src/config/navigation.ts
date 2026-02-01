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
    BrainCircuit
} from 'lucide-react';

export interface MenuItem {
    name: string;
    href: string;
    icon: any;
    roles?: string[];
    module?: string;
}

export interface MenuSection {
    label: string;
    items: MenuItem[];
}

export const menuSections: MenuSection[] = [
    {
        label: 'Core',
        items: [
            {
                name: 'Dashboard',
                href: '/admin', // Will be dynamic in component
                icon: LayoutDashboard
            },
            {
                name: 'My Files',
                href: '/admin/my-documents',
                icon: Shield
            },
            {
                name: 'Technical Support',
                href: '/admin/support',
                icon: LifeBuoy,
                roles: ['TECHNICAL', 'ENGINEERING']
            }
        ]
    },
    {
        label: 'Technical Inventory',
        items: [
            {
                name: `Technical Entities`,
                href: '/entities',
                icon: Zap,
                roles: ['ADMIN', 'TECHNICAL'],
                module: 'TECHNICAL'
            },
            {
                name: 'Knowledge Assets',
                href: '/admin/knowledge-assets',
                icon: FileText,
                roles: ['ADMIN', 'ENGINEERING'],
                module: 'RAG'
            },
            {
                name: 'Search Explorer',
                href: '/admin/knowledge-base',
                icon: Search,
                roles: ['ADMIN', 'SUPER_ADMIN'],
                module: 'RAG'
            },
            {
                name: 'Semantic Map',
                href: '/graphs',
                icon: Share2,
                roles: ['ADMIN', 'TECHNICAL'],
                module: 'TECHNICAL'
            }
        ]
    },
    {
        label: 'Engineering Studio',
        items: [
            {
                name: 'Workflows',
                href: '/admin/workflows',
                icon: GitBranch,
                roles: ['ADMIN', 'SUPER_ADMIN']
            },
            {
                name: 'Checklist Configs',
                href: '/admin/checklist-configs',
                icon: CheckSquare,
                roles: ['ADMIN', 'SUPER_ADMIN']
            },
            {
                name: 'Prompts',
                href: '/admin/prompts',
                icon: Terminal,
                roles: ['ADMIN', 'SUPER_ADMIN']
            },
            {
                name: 'Document Types',
                href: '/admin/document-types',
                icon: Settings,
                roles: ['ADMIN', 'SUPER_ADMIN']
            }
        ]
    },
    {
        label: 'Corporate & Admin',
        items: [
            {
                name: 'Organizations',
                href: '/admin/organizations',
                icon: Building,
                roles: ['ADMIN', 'SUPER_ADMIN']
            },
            {
                name: 'Users',
                href: '/admin/users',
                icon: Users,
                roles: ['ADMIN', 'SUPER_ADMIN']
            },
            {
                name: 'Billing',
                href: '/admin/billing',
                icon: CreditCard,
                roles: ['ADMIN', 'SUPER_ADMIN']
            },
            {
                name: 'API Keys',
                href: '/admin/api-keys',
                icon: Key,
                roles: ['ADMIN', 'SUPER_ADMIN']
            }
        ]
    },
    {
        label: 'Governance & Systems',
        items: [
            {
                name: 'Audit Trail',
                href: '/admin/audit',
                icon: History,
                roles: ['ADMIN', 'SUPER_ADMIN']
            },
            {
                name: 'Compliance',
                href: '/admin/compliance',
                icon: Scale,
                roles: ['ADMIN', 'SUPER_ADMIN']
            },
            {
                name: 'System Logs',
                href: '/admin/logs',
                icon: Activity,
                roles: ['SUPER_ADMIN']
            },
            {
                name: 'Global Analytics',
                href: '/admin/analytics',
                icon: TrendingUp,
                roles: ['SUPER_ADMIN']
            },
            {
                name: 'RAG Quality',
                href: '/admin/rag-quality',
                icon: ShieldCheck,
                roles: ['SUPER_ADMIN'],
                module: 'RAG'
            },
            {
                name: 'Active Intelligence',
                href: '/admin/intelligence/trends',
                icon: BrainCircuit,
                roles: ['SUPER_ADMIN', 'ADMIN'],
                module: 'RAG'
            }
        ]
    },
    {
        label: 'Preference',
        items: [
            {
                name: 'Notifications',
                href: '/admin/notifications',
                icon: Bell,
                roles: ['ADMIN', 'SUPER_ADMIN']
            },
            {
                name: 'Support',
                href: '/admin/support',
                icon: LifeBuoy,
                roles: ['ADMIN', 'SUPER_ADMIN']
            },
            {
                name: 'Profile',
                href: '/admin/profile',
                icon: UserCircle
            }
        ]
    }
];
