# HR Recruitment Dashboard

Internal recruitment tracker for **Aeris Beaute** and **From This Island**. One app, two brand workspaces — pipeline, progress, and vacancies stay separate per company.

Built with Next.js 16, React 19, Tailwind CSS v4, Framer Motion, and optional Supabase.

## Brands

| Brand | Industry | Workspace |
| --- | --- | --- |
| Aeris Beaute | Beauty & Personal Care | `/aeris-beaute` |
| From This Island | Skincare & Beauty | `/from-this-island` |

## Pages

1. `/login` — sign in
2. `/` — pick a brand
3. `/[company]` — overview
4. `/[company]/pipeline` — kanban
5. `/[company]/candidates` — Progress tracker
6. `/[company]/jobs` — Vacancy tracker

## Auth

Routes are protected. Roles are **Admin** and **HR**.

Seed admin account:

```
email:    dwiki@aerisbeaute.com
password: aerisbeaute
role:     admin
```

Users currently live in `src/lib/auth/users.ts`. Passwords are stored as scrypt hashes. Sessions use a signed httpOnly cookie (`AUTH_SECRET`).

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`.env.local` needs at least:

```
AUTH_SECRET=generate-a-long-random-string
```

Restart `npm run dev` after changing env files.

## Data

If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, the app uses **demo data**. Edits stay in that session.

To persist data in Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run `supabase/schema.sql` (tables + seed).
3. If those tables already exist from an older schema, run `supabase/migrate-tracker.sql` instead.
4. Copy the project URL and anon key into `.env.local`.
5. Restart the dev server.

Row Level Security in the schema is open for an internal MVP. Tighten it before production.

## Scripts

```bash
npm run dev    # local development
npm run build  # production build
npm run start  # serve the build
npm run lint   # ESLint
```
