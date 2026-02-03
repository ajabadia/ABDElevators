import { DefaultSession } from "next-auth";
import { UserRole } from "./roles";

export interface TenantAccess {
    tenantId: string;
    name: string;
    role: string;
    industry: string;
}

declare module "next-auth" {
    interface User {
        id: string;
        role: UserRole;
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
            role: UserRole;
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
        role: UserRole;
        baseRole: string;
        tenantId: string;
        industry: string;
        activeModules: string[];
        tenantAccess?: TenantAccess[];
        permissionGroups?: string[];
        permissionOverrides?: string[];
    }
}
