import { DefaultSession } from "next-auth";

export interface TenantAccess {
    tenantId: string;
    name: string;
    role: string;
    industry: string;
}

declare module "next-auth" {
    interface User {
        id: string;
        role: string;
        baseRole: string; // Original role from DB
        tenantId: string;
        industry: string;
        activeModules: string[];
        tenantAccess?: TenantAccess[];
        permissionGroups?: string[];
        permissionOverrides?: string[];
    }

    interface Session {
        user: {
            id: string;
            role: string;
            baseRole: string;
            tenantId: string;
            industry: string;
            activeModules: string[];
            tenantAccess?: TenantAccess[];
            permissionGroups?: string[];
            permissionOverrides?: string[];
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        baseRole: string;
        tenantId: string;
        industry: string;
        activeModules: string[];
        tenantAccess?: TenantAccess[];
        permissionGroups?: string[];
        permissionOverrides?: string[];
    }
}
