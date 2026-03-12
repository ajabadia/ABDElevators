import { Zap, LifeBuoy, Activity, ShieldCheck, Box, Search, FileText, Building, Users } from 'lucide-react';

/**
 * 📱 App Registry
 * Defines the applications available in the ABD RAG Platform Suite.
 */

export enum AppId {
    TECHNICAL = 'TECHNICAL',
    SUPPORT = 'SUPPORT',
    OPERATIONS = 'OPERATIONS',
    CONFIG = 'CONFIG',
    PERSONAL = 'PERSONAL',
    KNOWLEDGE = 'KNOWLEDGE',
    TASKS = 'TASKS',
    SEARCH = 'SEARCH',
    ORGANIZATIONS = 'ORGANIZATIONS',
    USERS = 'USERS',
    ADMIN = 'ADMIN'
}

export interface AppDefinition {
    id: AppId;
    nameKey: string;
    descriptionKey: string;
    icon: any;
    basePaths: string[]; // Updated in PHASE 221: Supports multiple base paths per App
    color: string;
    requiredModule?: string;
    roles?: string[];
}

export const APP_REGISTRY: Record<AppId, AppDefinition> = {
    [AppId.ADMIN]: {
        id: AppId.ADMIN,
        nameKey: 'apps.admin.name',
        descriptionKey: 'apps.admin.description',
        icon: Zap,
        basePaths: ['/admin-dashboard'],
        color: 'text-primary'
    },
    [AppId.TECHNICAL]: {
        id: AppId.TECHNICAL,
        nameKey: 'apps.technical.name',
        descriptionKey: 'apps.technical.description',
        icon: Zap,
        basePaths: ['/graphs', '/technical', '/agents', '/agents/graph', '/agents/prompts'],
        color: 'text-blue-500',
        requiredModule: 'TECHNICAL'
    },
    [AppId.SUPPORT]: {
        id: AppId.SUPPORT,
        nameKey: 'apps.support.name',
        descriptionKey: 'apps.support.description',
        icon: LifeBuoy,
        basePaths: ['/support', '/support-ticket', '/support-dashboard'],
        color: 'text-orange-500'
    },
    [AppId.OPERATIONS]: {
        id: AppId.OPERATIONS,
        nameKey: 'apps.operations.name',
        descriptionKey: 'apps.operations.description',
        icon: Activity,
        basePaths: ['/insights/operations', '/ops', '/entities', '/admin-dashboard'],
        color: 'text-emerald-500'
    },
    [AppId.TASKS]: {
        id: AppId.TASKS,
        nameKey: 'apps.tasks.name',
        descriptionKey: 'apps.tasks.description',
        icon: Activity,
        basePaths: ['/work/tasks', '/work/checklists', '/tasks'],
        color: 'text-primary'
    },
    [AppId.KNOWLEDGE]: {
        id: AppId.KNOWLEDGE,
        nameKey: 'apps.knowledge.name',
        descriptionKey: 'apps.knowledge.description',
        icon: FileText,
        basePaths: ['/intelligence/explorer', '/intelligence/document-types', '/intelligence'],
        color: 'text-secondary'
    },
    [AppId.SEARCH]: {
        id: AppId.SEARCH,
        nameKey: 'apps.search.name',
        descriptionKey: 'apps.search.description',
        icon: Search,
        basePaths: ['/search'],
        color: 'text-accent'
    },
    [AppId.PERSONAL]: {
        id: AppId.PERSONAL,
        nameKey: 'apps.personal.name',
        descriptionKey: 'apps.personal.description',
        icon: Box,
        basePaths: ['/intelligence/my-docs', '/intelligence/spaces', '/support', '/settings/profile', '/spaces', '/my-documents'],
        color: 'text-slate-500'
    },
    [AppId.ORGANIZATIONS]: {
        id: AppId.ORGANIZATIONS,
        nameKey: 'apps.organizations.name',
        descriptionKey: 'apps.organizations.description',
        icon: Building,
        basePaths: ['/settings/organization'],
        color: 'text-primary'
    },
    [AppId.USERS]: {
        id: AppId.USERS,
        nameKey: 'apps.users.name',
        descriptionKey: 'apps.users.description',
        icon: Users,
        basePaths: ['/settings/organization/team'],
        color: 'text-secondary'
    },
    [AppId.CONFIG]: {
        id: AppId.CONFIG,
        nameKey: 'apps.config.name',
        descriptionKey: 'apps.config.description',
        icon: ShieldCheck,
        basePaths: ['/settings/permissions', '/settings/system', '/settings/profile', '/settings'],
        color: 'text-purple-500'
    }
};

export const getAppByPath = (path: string): AppDefinition | undefined => {
    // Flatten all base paths with their corresponding apps
    const pathMappings = Object.values(APP_REGISTRY).flatMap(app =>
        app.basePaths.map(basePath => ({ app, basePath }))
    );

    // Sort by descending basePath length to match the most specific one first
    pathMappings.sort((a, b) => b.basePath.length - a.basePath.length);

    // Find the first matching path
    const match = pathMappings.find(mapping => path.startsWith(mapping.basePath));
    return match?.app;
};
