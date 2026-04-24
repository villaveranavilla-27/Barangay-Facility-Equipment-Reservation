export const ADMIN_ROLE = {
  CORE_ADMIN: "CORE_ADMIN",
  ADMIN: "ADMIN",
} as const;

export const ADMIN_ROLE_VALUES = [
  ADMIN_ROLE.CORE_ADMIN,
  ADMIN_ROLE.ADMIN,
] as const;

export type AdminRoleValue = (typeof ADMIN_ROLE_VALUES)[number];
