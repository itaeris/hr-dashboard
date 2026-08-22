# HR Recruitment Dashboard

Internal recruitment tracker for **Aeris Beaute** and **From This Island**. One app, two brand workspaces — pipeline, progress, and vacancies stay separate per company.

**Production:** [https://hr-dashboard-it-aeris.vercel.app/](https://hr-dashboard-it-aeris.vercel.app/)

Stack: Next.js 16, React 19, Tailwind CSS v4, Framer Motion, optional Supabase.

## Brands

| Brand | Industry | Workspace |
| --- | --- | --- |
| Aeris Beaute | Beauty & Personal Care | `/aeris-beaute` |
| From This Island | Skincare & Beauty | `/from-this-island` |

## Pages

| Route | Screen |
| --- | --- |
| `/login` | Sign in (email/password, then Google) |
| `/` | Brand picker |
| `/[company]` | Overview |
| `/[company]/pipeline` | Kanban |
| `/[company]/candidates` | Progress tracker |
| `/[company]/jobs` | Vacancy tracker |

## Auth

All routes except `/login` and `/api/auth/*` require a session.

Roles: **Admin** and **HR**.

- Google sign-in is limited to `@aerisbeaute.com` and `@fromthisisland.com`.
- Emails listed in `src/lib/auth/users.ts` keep that saved role.
- Any other allowed Google account starts as **HR**.

Seed admin (email + password):

```
email:    dwiki@aerisbeaute.com
password: aerisbeaute
role:     admin
```

Sessions use a signed httpOnly cookie (`AUTH_SECRET`).

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Restart after changing env files.

`.env.local` (local — do **not** set `AUTH_URL` here):

```
AUTH_SECRET=generate-a-long-random-string
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Without Supabase keys, the app uses **demo data** for that session.

## Google OAuth — Cloud Console (step by step)

URI values must match exactly. No trailing slash.

### 1. Project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Top bar → project picker → **New project**.
3. Name: `HR Recruitment` → **Create**.
4. Select that project.

### 2. Consent screen

1. Open [Google Auth platform](https://console.cloud.google.com/auth/overview)  
   (or **APIs & Services → OAuth consent screen**).
2. **Get started**.
3. App name: `HR Recruitment`.
4. User support email → **Next**.
5. Audience: **External** → **Next**.  
   Use External; **Internal** only works for a single Google Workspace.
6. Contact email → **Next** → accept → **Create**.

### 3. Scopes

1. **Data Access**.
2. Keep:
   - `openid`
   - `userinfo.email`
   - `userinfo.profile`
3. **Save**.

### 4. Test users (required while status is Testing)

1. **Audience → Test users → Add users**.
2. Add company addresses that should log in (for example `dwiki@aerisbeaute.com`).
3. Until you **Publish app**, only those users can complete Google sign-in.

The app still rejects non-company domains after publish.

### 5. OAuth client

1. **Clients → Create client**  
   (or **Credentials → Create credentials → OAuth client ID**).
2. Application type: **Web application**.
3. Name: `HR Dashboard`.
4. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://hr-dashboard-it-aeris.vercel.app`
5. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://hr-dashboard-it-aeris.vercel.app/api/auth/google/callback`
6. **Create**.
7. Copy **Client ID** and **Client secret** into `.env.local` and Vercel.

`redirect_uri_mismatch` means a URI in Console does not match one of the two callback URLs above.

## Production (Vercel)

### Environment variables

Project → **Settings → Environment Variables** (Production):

```
AUTH_SECRET=long-random-string
AUTH_URL=https://hr-dashboard-it-aeris.vercel.app
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=....
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Redeploy after saving.

### Deployment Protection

If the prod URL shows a **Vercel** login instead of HR sign-in:

1. Vercel → project → **Settings → Deployment Protection**
2. Set **Vercel Authentication** to **Only Preview Deployments** (or Off)
3. Save

The app still gates access with its own login.

## Data (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run `supabase/schema.sql`.
3. If tables already exist from an older schema, run `supabase/migrate-tracker.sql`.
4. Copy project URL and anon key into env.
5. Restart / redeploy.

Row Level Security in the schema is open for an internal MVP. Tighten it before a wider rollout.

## Scripts

```bash
npm run dev    # local development
npm run build  # production build
npm run start  # serve the build
npm run lint   # ESLint
```
