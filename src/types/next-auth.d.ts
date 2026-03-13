import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { UserRole } from "./roles";
import { IndustryType } from "@/lib/schemas";

export interface TenantAccess {
    tenantId: string;
    name: string;
    role: string;
    industry: string;
}

declare module "next-auth" {
    interface User extends DefaultUser {
        id: string;
        role: UserRole;
        baseRole: string;
        tenantId: string;
        industry: IndustryType;
        activeModules: string[];
        tenantAccess?: TenantAccess[];
        permissionGroups?: string[];
        permissionOverrides?: string[];
        mfaVerified?: boolean;
        mfaPending?: boolean;
        sessionId?: string;
        preferences?: {
            uxMode?: 'simple' | 'expert';
            [key: string]: any;
        };
    }

    interface Session extends DefaultSession {
        user: {
            id: string;
            role: UserRole;
            baseRole: string;
            tenantId: string;
            industry: IndustryType;
            activeModules: string[];
            tenantAccess?: TenantAccess[];
            permissionGroups?: string[];
            permissionOverrides?: string[];
            mfaVerified?: boolean;
            mfaPending?: boolean;
            preferences?: {
                uxMode?: 'simple' | 'expert';
                [key: string]: any;
            };
        } & DefaultSession["user"];
        tenantId: string;
        role: UserRole;
        industry: IndustryType;
        sessionId?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        role: UserRole;
        baseRole: string;
        tenantId: string;
        industry: IndustryType;
        activeModules: string[];
        image?: string | null;
        tenantAccess?: TenantAccess[];
        permissionGroups?: string[];
        permissionOverrides?: string[];
        mfaVerified?: boolean;
        mfaPending?: boolean;
        sessionId?: string;
        preferences?: {
            uxMode?: 'simple' | 'expert';
            [key: string]: any;
        };
    }
}
