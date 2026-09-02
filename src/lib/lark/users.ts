export type LarkUser = {
  id: string;
  name: string;
  email: string;
  department: string;
};

export function larkUserLabel(user: Pick<LarkUser, "name" | "email" | "department">) {
  const detail = user.email || user.department;
  return detail ? `${user.name} · ${detail}` : user.name;
}

export function findLarkUser(users: LarkUser[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  return (
    users.find((user) => user.id === query) ??
    users.find((user) => user.email && user.email.toLowerCase() === needle) ??
    users.find((user) => larkUserLabel(user).toLowerCase() === needle) ??
    users.find((user) => user.name.toLowerCase() === needle) ??
    null
  );
}

export function filterLarkUsers(users: LarkUser[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return users;
  return users.filter((user) => {
    return (
      user.name.toLowerCase().includes(needle) ||
      user.email.toLowerCase().includes(needle) ||
      user.department.toLowerCase().includes(needle)
    );
  });
}
