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

Google sign-in is limited to `@aerisbeaute.com` and `@fromthisisland.com`. Any other Google account is rejected. Known emails in `src/lib/auth/users.ts` keep their saved role; new Google users start as **HR**.

Seed admin (email + password, still works):

```
email:    dwiki@aerisbeaute.com
password: aerisbeaute
role:     admin
```

Sessions use a signed httpOnly cookie (`AUTH_SECRET`).

## Google OAuth — Google Cloud Console

Do this once. Local redirect URI must match exactly.

### 1. Open a project

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Top bar → project picker → **New project**.
3. Name it something like `HR Recruitment` → **Create**.
4. Select that project.

### 2. OAuth consent screen

Google now calls this **Google Auth platform**.

1. Open [Google Auth platform](https://console.cloud.google.com/auth/overview) (or **APIs & Services → OAuth consent screen**).
2. Click **Get started**.
3. App name: `HR Recruitment`.
4. User support email: your Google account → **Next**.
5. Audience: **External**.  
   Use External because the two brands are different domains. **Internal** only works for a single Google Workspace org.
6. Contact email → **Next** → accept → **Create**.

### 3. Scopes

1. **Data Access** (or **Edit app → Scopes**).
2. Add (these are usually already included):
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
3. Save.

### 4. Test users (while the app is in Testing)

1. **Audience → Test users → Add users**.
2. Add the company Gmail/Workspace addresses that should log in, e.g. `dwiki@aerisbeaute.com`.
3. Until you click **Publish app**, only test users can sign in.

You can publish later. The app still blocks non-company domains even after publishing.

### 5. Create the OAuth client

1. **Clients → Create client** (or **APIs & Services → Credentials → Create credentials → OAuth client ID**).
2. Application type: **Web application**.
3. Name: `HR Dashboard local`.
4. **Authorized JavaScript origins** → **Add URI**:
   - `http://localhost:3000`
   - `https://hr-dashboard-it-aeris.vercel.app`
5. **Authorized redirect URIs** → **Add URI**:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://hr-dashboard-it-aeris.vercel.app/api/auth/google/callback`
6. **Create**.
7. Copy **Client ID** and **Client secret**.

### 6. Local env (`.env.local`)

```
AUTH_SECRET=generate-a-long-random-string
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=....
```

Do **not** set `AUTH_URL` locally. Restart `npm run dev`.

If Google shows `redirect_uri_mismatch`, the URI in Console must match exactly (no trailing slash).

## Production (Vercel)

App URL: [https://hr-dashboard-it-aeris.vercel.app/](https://hr-dashboard-it-aeris.vercel.app/)

### Vercel environment variables

Project → **Settings → Environment Variables** (Production):

```
AUTH_SECRET=same-or-new-long-random-string
AUTH_URL=https://hr-dashboard-it-aeris.vercel.app
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=....
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Redeploy after saving.

### Vercel Deployment Protection

If that URL opens a **Vercel login** instead of the HR sign-in page, Standard Protection is on. Turn it off so Google can reach the app:

1. Vercel → project → **Settings → Deployment Protection**
2. Set **Vercel Authentication** to **Only Preview Deployments** (or Off)
3. Save

The app still has its own login (Google domain allowlist + password).

### Google Console (same OAuth client)

Keep localhost **and** add production:

| Field | Value |
| --- | --- |
| JavaScript origin | `https://hr-dashboard-it-aeris.vercel.app` |
| Redirect URI | `https://hr-dashboard-it-aeris.vercel.app/api/auth/google/callback` |

Save the client. Changes can take a few minutes.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Restart after changing env files.

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
