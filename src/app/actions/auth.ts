"use server";

import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getStoredUser, savePasswordOverride } from "@/lib/auth/password-store";
import { clearSession, getSession, setSession } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/users";

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

  await setSession(toPublicUser(user));
  redirect("/");
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
