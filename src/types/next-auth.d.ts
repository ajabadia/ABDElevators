import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { UserRole } from "./roles";

export interface TenantAccess {
    tenantId: string;
    name: string;
    role: string;
    industry: string;
}

declare module "next-auth" {
    interface User extends DefaultUser {
        role: UserRole;
        baseRole: string;
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
    interface JWT extends DefaultJWT {
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
