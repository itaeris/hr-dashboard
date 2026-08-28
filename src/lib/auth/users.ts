export type Role = "admin" | "hr" | "it";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type StoredUser = AuthUser & {
  passwordSalt: string;
  passwordHash: string;
};

export const USERS: StoredUser[] = [
  {
    id: "usr_dwiki",
    email: "dwiki@aerisbeaute.com",
    name: "Dwiki",
    role: "admin",
    passwordSalt: "1fbb1090c373ffc0796e65129b372452",
    passwordHash:
      "8862a1603555c6e5d8923f6a82dafd3495b1c26471c526847a2d90ba14c4857fd1f94e8a5c821300aa8aba1753bf472fb1547f8facb44667253669fe297a7350",
  },
];

export function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return USERS.find((user) => user.email === normalized) ?? null;
}

export function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function parseRole(value: string | undefined | null): Role {
  if (value === "admin" || value === "it" || value === "hr") return value;
  return "hr";
}

export function roleLabel(role: Role) {
  if (role === "admin") return "Admin";
  if (role === "it") return "IT";
  return "HR";
}

export function isItRole(role: Role) {
  return role === "it";
}

export function canUseHrMenu(role: Role) {
  return role === "admin" || role === "hr";
}
