type AuthPrincipal = {
  role?: "ADMIN" | "USER";
  adminRole?: "CORE_ADMIN" | "ADMIN" | null;
  adminActive?: boolean | null;
  userActive?: boolean | null;
} | null | undefined;

export function isActiveAdmin(principal: AuthPrincipal) {
  return principal?.role === "ADMIN" && principal?.adminActive !== false;
}

export function isActiveUser(principal: AuthPrincipal) {
  return principal?.role === "USER" && principal?.userActive !== false;
}

export function isCoreAdmin(principal: AuthPrincipal) {
  return isActiveAdmin(principal) && principal?.adminRole === "CORE_ADMIN";
}

export function isInactiveAdmin(principal: AuthPrincipal) {
  return principal?.role === "ADMIN" && principal?.adminActive === false;
}

export function isInactiveUser(principal: AuthPrincipal) {
  return principal?.role === "USER" && principal?.userActive === false;
}
