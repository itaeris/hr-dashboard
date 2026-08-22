import type { CompanySlug } from "../types";
import type { AuthUser, Role } from "./users";

export type CompanyAccess = CompanySlug | "both";

export function companyFromEmail(email: string): CompanySlug {
  const normalized = email.trim().toLowerCase();
  if (
    normalized === "fitria@fromthisisland.com" ||
    normalized.endsWith("@fromthisisland.com")
  ) {
    return "from-this-island";
  }
  return "aeris-beaute";
}

export function canAccessCompany(user: AuthUser, slug: CompanySlug, assigned?: CompanyAccess) {
  if (user.role === "admin") return true;
  if (!assigned || assigned === "both") {
    return assigned === "both" ? true : companyFromEmail(user.email) === slug;
  }
  return assigned === slug;
}

export function homePath(user: AuthUser, assigned?: CompanyAccess) {
  if (user.role === "admin") return "/";
  const slug = assigned && assigned !== "both" ? assigned : companyFromEmail(user.email);
  return `/${slug}`;
}

export function workspaceLabel(access: CompanyAccess) {
  if (access === "both") return "Both brands";
  if (access === "from-this-island") return "From This Island";
  return "Aeris Beaute";
}

export function defaultAccessForRole(role: Role, email: string): CompanyAccess {
  return role === "admin" ? "both" : companyFromEmail(email);
}
