## HostMate — Reservations + Chat Agent

Production-ready Next.js app with a natural-language reservation assistant, Supabase backend, and safe secret handling for public repos.

## Quick start

1) Copy env template and fill values locally (do NOT commit real keys):

```bash
cp .env.example .env.local
```

Required envs (see .env.example):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_BASE_URL (optional; defaults to http://localhost:3000)
- SUPABASE_SERVICE_ROLE_KEY (server only)
- GEMINI_API_KEY (server only)
- EMAIL_PROCESSOR_API_KEY (if using email queue route)

2) Install and run dev:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Safe secrets in a public repo

- .gitignore is configured to ignore all .env files; only .env.example is tracked.
- Never commit real secrets. Use .env.local for development only.
- The API route reads server-only keys from process.env (e.g., GEMINI_API_KEY). Client-side Supabase uses NEXT_PUBLIC_ vars.

### If you accidentally committed .env.local

1) Remove the file and untrack it:

```bash
git rm --cached .env.local
```

2) Rotate keys (Supabase anon + service role, Gemini) in their respective dashboards.

3) Force-purge from history (optional, if the repo was public):

```bash
git filter-repo --path .env.local --invert-paths
git push --force
```

Alternatively use BFG Repo-Cleaner.

## Deploy

Vercel (recommended):
- Import the repo into Vercel
- In Project Settings → Environment Variables, set:
	- NEXT_PUBLIC_SUPABASE_URL
	- NEXT_PUBLIC_SUPABASE_ANON_KEY
	- NEXT_PUBLIC_BASE_URL (e.g., https://your-vercel-domain.vercel.app)
	- SUPABASE_SERVICE_ROLE_KEY
	- GEMINI_API_KEY
	- EMAIL_PROCESSOR_API_KEY (if using email queue)
- Redeploy. Do not add these to the repo.

Supabase:
- Create a project, copy URL and ANON key to envs above
- Service Role key is required only for server functions that need elevated access

## Notes

- The agent gracefully falls back to static Q&A if GEMINI_API_KEY is not set (reservation parsing still works).
- All reservation creations go through a server route; no secrets are exposed to the browser.
