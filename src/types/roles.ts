export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
    TECHNICAL = 'TECHNICAL',
    ENGINEERING = 'ENGINEERING'
}

export const USER_ROLES = Object.values(UserRole);

export type RoleCheck = UserRole | UserRole[];
