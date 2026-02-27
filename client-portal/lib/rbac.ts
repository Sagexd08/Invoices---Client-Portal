import type { User } from '@prisma/client'

export type Role = User['role']

const ROLE_HIERARCHY: Record<Role, number> = {
    company_admin: 50,
    project_manager: 40,
    accountant: 30,
    client_admin: 20,
    client_collaborator: 10,
}
export function hasRole(userRole: Role, requiredRole: Role): boolean {
    return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}

export const COMPANY_ROLES: Role[] = ['company_admin', 'project_manager', 'accountant']
export const CLIENT_ROLES: Role[] = ['client_admin', 'client_collaborator']

export function isCompanyUser(role: Role) {
    return COMPANY_ROLES.includes(role)
}

export function isClientUser(role: Role) {
    return CLIENT_ROLES.includes(role)
}
