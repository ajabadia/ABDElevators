export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
    SUPPORT = 'SUPPORT',
    TECHNICAL = 'TECHNICAL',
    ENGINEERING = 'ENGINEERING',
    ADMINISTRATIVE = 'ADMINISTRATIVE',
    COMPLIANCE = 'COMPLIANCE',
    REVIEWER = 'REVIEWER'
}

export const USER_ROLES = Object.values(UserRole);

export type RoleCheck = UserRole | UserRole[];
