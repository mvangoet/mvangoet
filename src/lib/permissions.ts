import { UserRole } from "@prisma/client";

export const sections = ["dashboard", "partners", "inventory", "orders", "invoices", "shipments", "users"] as const;
export type AppSection = (typeof sections)[number];

const permissions: Record<AppSection, UserRole[]> = {
  dashboard: [UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.LOGISTICS, UserRole.FINANCE],
  partners: [UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE],
  inventory: [UserRole.ADMIN, UserRole.LOGISTICS],
  orders: [UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.LOGISTICS, UserRole.FINANCE],
  invoices: [UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE],
  shipments: [UserRole.ADMIN, UserRole.LOGISTICS],
  users: [UserRole.ADMIN],
};

export function canAccessSection(role: UserRole, section: AppSection) {
  return permissions[section].includes(role);
}

export function getAccessibleSections(role: UserRole) {
  return sections.filter((section) => canAccessSection(role, section));
}
