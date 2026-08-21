"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { clearSession, getSession, setSession } from "@/lib/auth/session";
import { findUserByEmail, toPublicUser } from "@/lib/auth/users";

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

  const user = findUserByEmail(email);
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
