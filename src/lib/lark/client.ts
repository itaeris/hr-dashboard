import "server-only";

import { unstable_cache } from "next/cache";
import type { LarkUser } from "./users";

export type { LarkUser };
export { filterLarkUsers, larkUserLabel } from "./users";

const DEFAULT_BASES = [
  "https://open.larksuite.com",
  "https://open.feishu.cn",
];

const TOKEN_SKEW_MS = 120_000;
const USERS_TTL_MS = 15 * 60_000;
const USERS_STALE_MS = 60 * 60_000;
const USER_FETCH_CONCURRENCY = 8;

type TokenState = { token: string; expiresAt: number; base: string };
let tokenState: TokenState | null = null;
let usersState: { users: LarkUser[]; expiresAt: number; staleUntil: number } | null = null;
let usersInflight: Promise<LarkUser[]> | null = null;

function configuredBases() {
  const explicit = process.env.LARK_API_BASE?.replace(/\/$/, "");
  if (!explicit) return DEFAULT_BASES;
  return [explicit, ...DEFAULT_BASES.filter((item) => item !== explicit)];
}

function credentials() {
  const appId = process.env.LARK_APP_ID?.trim() ?? "";
  const appSecret = process.env.LARK_APP_SECRET?.trim() ?? "";
  return { appId, appSecret };
}

export function isLarkConfigured() {
  const { appId, appSecret } = credentials();
  return Boolean(appId && appSecret);
}

async function readJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(text.slice(0, 180) || `Lark request failed (${response.status})`);
  }
}

async function mintToken(base: string) {
  const { appId, appSecret } = credentials();
  const response = await fetch(`${base}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const payload = await readJson(response);
  if (payload.code !== 0 || typeof payload.tenant_access_token !== "string") {
    throw new Error(String(payload.msg ?? "Could not authenticate with Lark."));
  }
  const expire = typeof payload.expire === "number" ? payload.expire : 7200;
  return {
    token: payload.tenant_access_token,
    expiresAt: Date.now() + expire * 1000 - TOKEN_SKEW_MS,
    base,
  } satisfies TokenState;
}

async function tenantAuth() {
  if (tokenState && Date.now() < tokenState.expiresAt) return tokenState;

  let lastError: Error | null = null;
  for (const base of configuredBases()) {
    try {
      tokenState = await mintToken(base);
      return tokenState;
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error("Lark auth failed.");
    }
  }
  throw lastError ?? new Error("Lark auth failed.");
}

async function larkRequest(
  method: "GET" | "POST",
  path: string,
  init?: { query?: Record<string, string | undefined>; body?: unknown },
) {
  const auth = await tenantAuth();
  const url = new URL(path, `${auth.base}/`);
  for (const [key, value] of Object.entries(init?.query ?? {})) {
    if (value) url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${auth.token}`,
      ...(init?.body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const payload = await readJson(response);
  if (payload.code !== 0) {
    throw new Error(String(payload.msg ?? "Lark request failed."));
  }
  return payload;
}

async function larkGet(path: string, query: Record<string, string | undefined> = {}) {
  return larkRequest("GET", path, { query });
}

export async function larkPost(
  path: string,
  body: unknown,
  query: Record<string, string | undefined> = {},
) {
  return larkRequest("POST", path, { body, query });
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asItems(payload: Record<string, unknown>) {
  const data = asRecord(payload.data);
  return Array.isArray(data.items) ? data.items : [];
}

function pageToken(payload: Record<string, unknown>) {
  const data = asRecord(payload.data);
  return data.has_more && typeof data.page_token === "string" ? data.page_token : "";
}

async function paginate(path: string, query: Record<string, string | undefined>) {
  const pages: unknown[] = [];
  let token = "";
  do {
    const payload = await larkGet(path, { ...query, page_token: token || undefined });
    pages.push(...asItems(payload));
    token = pageToken(payload);
  } while (token);
  return pages;
}

async function mapPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  if (items.length === 0) return;
  let next = 0;
  async function run() {
    while (next < items.length) {
      const current = next;
      next += 1;
      await worker(items[current]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
}

async function loadDepartmentScope() {
  const ids = new Set<string>(["0"]);
  const names = new Map<string, string>();
  const userIds: string[] = [];

  try {
    let token = "";
    do {
      const payload = await larkGet("/open-apis/contact/v3/scopes", {
        page_size: "100",
        department_id_type: "open_department_id",
        user_id_type: "open_id",
        page_token: token || undefined,
      });
      const data = asRecord(payload.data);
      for (const id of Array.isArray(data.department_ids) ? data.department_ids : []) {
        if (typeof id === "string" && id) ids.add(id);
      }
      for (const id of Array.isArray(data.user_ids) ? data.user_ids : []) {
        if (typeof id === "string" && id) userIds.push(id);
      }
      token = pageToken(payload);
    } while (token);
  } catch {
    /* find_by_department on root still runs */
  }

  try {
    const items = await paginate("/open-apis/contact/v3/departments/0/children", {
      department_id_type: "open_department_id",
      fetch_child: "true",
      page_size: "50",
    });
    for (const item of items) {
      const row = asRecord(item);
      const id = stringField(row, "open_department_id", "department_id");
      if (!id) continue;
      ids.add(id);
      const name = stringField(row, "name");
      if (name) names.set(id, name);
    }
  } catch {
    /* Scoped department ids are enough when the tree walk is denied. */
  }

  return { departmentIds: [...ids], userIds, names };
}

function stringField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object") {
      const nested = asRecord(value);
      const nestedName =
        stringField(nested, "default_value", "default", "name", "en_us", "zh_cn") ||
        (nested.i18n_value && typeof nested.i18n_value === "object"
          ? stringField(asRecord(nested.i18n_value), "en_us", "zh_cn", "default")
          : "");
      if (nestedName) return nestedName;
    }
  }
  return "";
}

function userFromRow(row: Record<string, unknown>): LarkUser | null {
  const status = asRecord(row.status);
  if (status.is_resigned === true || status.is_exited === true || status.is_unjoin === true) {
    return null;
  }
  if (status.is_activated === false) return null;

  const id = stringField(row, "open_id", "user_id", "union_id");
  const name = stringField(row, "name", "en_name", "nickname");
  const email = stringField(row, "email", "enterprise_email");
  const departments = Array.isArray(row.department_ids)
    ? row.department_ids.filter((item): item is string => typeof item === "string")
    : [];

  if (!id && !name && !email) return null;

  return {
    id: id || email || name,
    name: name || email || "Lark user",
    email,
    department: departments[0] ?? "",
  };
}

async function usersByIds(userIds: string[]) {
  const users: LarkUser[] = [];
  const chunks: string[][] = [];
  for (let index = 0; index < userIds.length; index += 50) {
    chunks.push(userIds.slice(index, index + 50));
  }
  await mapPool(chunks, USER_FETCH_CONCURRENCY, async (chunk) => {
    const params = new URLSearchParams({ user_id_type: "open_id" });
    for (const id of chunk) params.append("user_ids", id);
    try {
      const payload = await larkGet(`/open-apis/contact/v3/users/batch?${params.toString()}`);
      const data = asRecord(payload.data);
      const items = Array.isArray(data.items) ? data.items : [];
      for (const item of items) {
        const user = userFromRow(asRecord(item));
        if (user) users.push(user);
      }
    } catch {
      /* Batch get is optional; department listing remains the source of truth. */
    }
  });
  return users;
}

async function fetchDirectory() {
  const users = new Map<string, LarkUser>();
  const { departmentIds, userIds, names } = await loadDepartmentScope();

  await Promise.all([
    usersByIds(userIds).then((list) => {
      for (const user of list) users.set(user.id, user);
    }),
    mapPool(departmentIds, USER_FETCH_CONCURRENCY, async (departmentId) => {
      try {
        const items = await paginate("/open-apis/contact/v3/users/find_by_department", {
          department_id: departmentId,
          department_id_type: "open_department_id",
          user_id_type: "open_id",
          page_size: "50",
        });
        for (const item of items) {
          const row = asRecord(item);
          const user = userFromRow({ ...row, ...asRecord(row.user) });
          if (user) users.set(user.id, user);
        }
      } catch {
        /* Skip departments the app cannot read. */
      }
    }),
  ]);

  const list = [...users.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  if (list.length === 0) {
    throw new Error(
      "Lark returned no users. Confirm the app contacts scope is All members, then republish the app.",
    );
  }
  if (list.every((user) => user.name === "Lark user" && !user.email)) {
    throw new Error(
      "Lark users are visible, but names are hidden. Add permission “Get user's basic information” (contact:user.base:readonly). For emails, also add “Obtain user's email information” (contact:user.email:readonly). Publish the app again, then retry.",
    );
  }

  return list.map((user) => ({
    ...user,
    department: names.get(user.department) ?? user.department,
  }));
}

function rememberUsers(users: LarkUser[]) {
  const now = Date.now();
  usersState = {
    users,
    expiresAt: now + USERS_TTL_MS,
    staleUntil: now + USERS_STALE_MS,
  };
  return users;
}

const cachedDirectory = unstable_cache(
  async () => fetchDirectory(),
  ["lark-users-directory-v2"],
  { revalidate: 900 },
);

function refreshUsers() {
  if (usersInflight) return usersInflight;
  usersInflight = cachedDirectory()
    .then(rememberUsers)
    .catch((cause) => {
      if (usersState) return usersState.users;
      throw cause;
    })
    .finally(() => {
      usersInflight = null;
    });
  return usersInflight;
}

export async function listLarkUsers() {
  if (!isLarkConfigured()) {
    throw new Error("Lark is not configured. Add LARK_APP_ID and LARK_APP_SECRET.");
  }
  const now = Date.now();
  if (usersState && now < usersState.expiresAt) return usersState.users;
  if (usersState && now < usersState.staleUntil) {
    void refreshUsers();
    return usersState.users;
  }
  return refreshUsers();
}
