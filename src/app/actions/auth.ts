"use server";

import { redirect } from "next/navigation";
import { canAccessCompany, companyFromEmail } from "@/lib/auth/access";
import {
  deleteAppUser,
  homePathForUser,
  listAppUsers,
  loadAppUser,
  saveAppUser,
} from "@/lib/auth/app-users";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  deletePasswordOverride,
  getStoredUser,
  savePasswordOverride,
} from "@/lib/auth/password-store";
import { clearSession, getSession, setSession } from "@/lib/auth/session";
import { toPublicUser, type Role } from "@/lib/auth/users";
import { isCompanySlug } from "@/lib/companies";
import type { CompanySlug } from "@/lib/types";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email.trim() || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await getStoredUser(email);
  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return { error: "Incorrect email or password." };
  }

  const sessionUser = toPublicUser(user);
  const profile = await loadAppUser(sessionUser.email);
  if (profile) {
    sessionUser.name = profile.name;
    sessionUser.role = profile.role;
  }
  await setSession(sessionUser);
  redirect(await homePathForUser(sessionUser));
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "admin") {
    redirect(await homePathForUser(session));
  }
  return session;
}

export async function requireCompanyAccess(slug: CompanySlug) {
  const session = await requireSession();
  const profile = await loadAppUser(session.email);
  if (!canAccessCompany(session, slug, profile?.company)) {
    redirect(await homePathForUser(session));
  }
  return session;
}

export type PasswordState = { error?: string; success?: string } | null;

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const session = await getSession();
  if (!session) return { error: "Sign in again to change your password." };

  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (next.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (next !== confirm) {
    return { error: "New password and confirmation do not match." };
  }

  const stored = await getStoredUser(session.email);
  if (stored) {
    if (!current) return { error: "Enter your current password." };
    if (!verifyPassword(current, stored.passwordSalt, stored.passwordHash)) {
      return { error: "Current password is incorrect." };
    }
  }

  const { salt, hash } = hashPassword(next);
  try {
    await savePasswordOverride({
      email: session.email,
      salt,
      hash,
      name: session.name,
      role: session.role,
    });
  } catch (cause) {
    return {
      error:
        cause instanceof Error
          ? cause.message
          : "Could not save the new password.",
    };
  }

  return { success: "Password updated. Use it the next time you sign in." };
}

export type RoleState = { error?: string; success?: string } | null;

export async function saveAppUserAction(
  _prev: RoleState,
  formData: FormData,
): Promise<RoleState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Only admin can change user roles." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "hr") as Role;
  const companyRaw = String(formData.get("company") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!email || !email.includes("@")) return { error: "Enter a valid email." };
  if (!name) return { error: "Enter a name." };
  if (role !== "admin" && role !== "hr") return { error: "Pick a valid role." };

  const company =
    companyRaw === "both" || isCompanySlug(companyRaw) ? companyRaw : undefined;
  if (role === "hr" && company === "both") {
    return { error: "HR can only be assigned to one brand." };
  }

  const users = await listAppUsers();
  const existing = users.find((item) => item.email === email);
  if (session.email === email && role !== "admin") {
    return { error: "You cannot remove your own admin role." };
  }
  if (existing?.role === "admin" && role !== "admin") {
    const admins = users.filter((item) => item.role === "admin");
    if (admins.length <= 1) return { error: "Keep at least one admin." };
  }

  if (password || confirmPassword) {
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }
    if (password !== confirmPassword) {
      return { error: "Password and confirmation do not match." };
    }
  } else if (!existing) {
    return { error: "Set a password for the new user." };
  }

  try {
    await saveAppUser({
      email,
      name,
      role,
      company:
        role === "admin"
          ? "both"
          : isCompanySlug(companyRaw)
            ? companyRaw
            : companyFromEmail(email),
    });
    if (password) {
      const { salt, hash } = hashPassword(password);
      await savePasswordOverride({ email, salt, hash, name, role });
    }
  } catch (cause) {
    return {
      error: cause instanceof Error ? cause.message : "Could not save user.",
    };
  }

  return {
    success: password
      ? `Saved ${name} and updated the password.`
      : `Saved ${name} as ${role === "admin" ? "Admin" : "HR"}.`,
  };
}

export async function deleteAppUserAction(
  _prev: RoleState,
  formData: FormData,
): Promise<RoleState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Only admin can delete users." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Pick a user to delete." };
  if (email === session.email) return { error: "You cannot delete your own account." };

  const users = await listAppUsers();
  const target = users.find((item) => item.email === email);
  if (!target) return { error: "User not found." };
  if (target.role === "admin") {
    const admins = users.filter((item) => item.role === "admin");
    if (admins.length <= 1) return { error: "Keep at least one admin." };
  }

  try {
    await deleteAppUser(email);
    await deletePasswordOverride(email);
  } catch (cause) {
    return {
      error: cause instanceof Error ? cause.message : "Could not delete user.",
    };
  }

  return { success: `Deleted ${target.name}.` };
}
