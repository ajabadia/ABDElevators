import { Zap, LifeBuoy, Activity, ShieldCheck, Box, Search, FileText, Building, Users } from 'lucide-react';

/**
 * 📱 App Registry
 * Define las aplicaciones disponibles en la Suite de ABD RAG Platform.
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
    basePath: string;
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
        basePath: '/admin',
        color: 'text-primary'
    },
    [AppId.TECHNICAL]: {
        id: AppId.TECHNICAL,
        nameKey: 'apps.technical.name',
        descriptionKey: 'apps.technical.description',
        icon: Zap,
        basePath: '/technical',
        color: 'text-blue-500',
        requiredModule: 'TECHNICAL'
    },
    [AppId.SUPPORT]: {
        id: AppId.SUPPORT,
        nameKey: 'apps.support.name',
        descriptionKey: 'apps.support.description',
        icon: LifeBuoy,
        basePath: '/support',
        color: 'text-orange-500'
    },
    [AppId.OPERATIONS]: {
        id: AppId.OPERATIONS,
        nameKey: 'apps.operations.name',
        descriptionKey: 'apps.operations.description',
        icon: Activity,
        basePath: '/ops/reports',
        color: 'text-emerald-500'
    },
    [AppId.TASKS]: {
        id: AppId.TASKS,
        nameKey: 'apps.tasks.name',
        descriptionKey: 'apps.tasks.description',
        icon: Activity,
        basePath: '/tasks',
        color: 'text-primary'
    },
    [AppId.KNOWLEDGE]: {
        id: AppId.KNOWLEDGE,
        nameKey: 'apps.knowledge.name',
        descriptionKey: 'apps.knowledge.description',
        icon: FileText,
        basePath: '/admin/knowledge',
        color: 'text-secondary'
    },
    [AppId.SEARCH]: {
        id: AppId.SEARCH,
        nameKey: 'apps.search.name',
        descriptionKey: 'apps.search.description',
        icon: Search,
        basePath: '/search',
        color: 'text-accent'
    },
    [AppId.PERSONAL]: {
        id: AppId.PERSONAL,
        nameKey: 'apps.personal.name',
        descriptionKey: 'apps.personal.description',
        icon: Box,
        basePath: '/spaces',
        color: 'text-slate-500'
    },
    [AppId.ORGANIZATIONS]: {
        id: AppId.ORGANIZATIONS,
        nameKey: 'apps.organizations.name',
        descriptionKey: 'apps.organizations.description',
        icon: Building,
        basePath: '/admin/organizations',
        color: 'text-primary'
    },
    [AppId.USERS]: {
        id: AppId.USERS,
        nameKey: 'apps.users.name',
        descriptionKey: 'apps.users.description',
        icon: Users,
        basePath: '/admin/users',
        color: 'text-secondary'
    },
    [AppId.CONFIG]: {
        id: AppId.CONFIG,
        nameKey: 'apps.config.name',
        descriptionKey: 'apps.config.description',
        icon: ShieldCheck,
        basePath: '/admin/permissions',
        color: 'text-purple-500'
    }
};

export const getAppByPath = (path: string): AppDefinition | undefined => {
    // Ordenar por longitud de basePath descendente para matchear lo más específico primero
    const apps = Object.values(APP_REGISTRY).sort((a, b) => b.basePath.length - a.basePath.length);
    return apps.find(app => path.startsWith(app.basePath));
};
