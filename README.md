# Cyber Command Center

A self-hosted cybersecurity learning platform with progress tracking, study timer, and notes — backed by Supabase with optional guest mode.

## Architecture

```
┌─────────────────────────────────┐
│         React Frontend          │
│       (Vite + React 18)         │
├─────────────────────────────────┤
│       Supabase Client SDK       │
├─────────────────────────────────┤
│         Supabase Backend        │
│  ┌───────┐ ┌──────┐ ┌────────┐ │
│  │ Auth  │ │ DB   │ │ RLS    │ │
│  │(email)│ │(PG)  │ │policies│ │
│  └───────┘ └──────┘ └────────┘ │
└─────────────────────────────────┘
```

## Quick Start

### 1. Set up Supabase (free tier)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings > API** and copy your:
   - Project URL (e.g. `https://xxxxx.supabase.co`)
   - `anon` public key

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and paste your Supabase URL and anon key.

### 3. Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

### 4. Deploy to Netlify

```bash
npm run build
```

Option A — Drag and drop the `dist/` folder at [app.netlify.com/drop](https://app.netlify.com/drop)

Option B — Connect your GitHub repo. The included `netlify.toml` handles build config automatically.

Set environment variables in Netlify dashboard (Site Settings > Environment Variables):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Docker:**
```bash
docker build -t cyber-command .
docker run -p 3000:3000 cyber-command
```

## Features

- **Email + Google auth** — sign up, log in, password reset, OAuth
- **Guest mode** — use without an account; progress saved to localStorage (won't sync across devices)
- **6-phase curriculum** — 240+ hours of hands-on cybersecurity training
- **Task tracking** — synced across devices (or local-only in guest mode)
- **Study timer** — start/pause/stop with session logging
- **Training log** — daily breakdown, streak counter, cumulative hours
- **Per-task notes** — paste commands, flags, findings
- **Row Level Security** — each user can only see their own data

### Curriculum Phases

| Phase | Focus | Hours |
|-------|-------|-------|
| 01 — Foundations | Networking, Linux, Cryptography | ~60h |
| 02 — SOC Operations | SIEM, Detection, Incident Response | ~50h |
| 03 — Ethical Hacking | VAPT, Metasploit, CTF Prep | ~60h |
| 04 — Digital Forensics | Memory, Disk, Network Analysis | ~40h |
| 05 — Governance & Strategy | Frameworks, Compliance, Risk | ~30h |
| 06 — Certification Track | Security+, CySA+, OSCP | — |

## Tech Stack

- React 18 + Vite 5
- Supabase (Auth + PostgreSQL + RLS)
- Custom dark terminal aesthetic (no CSS framework)
- Netlify deployment with security headers

## Security Headers

The `netlify.toml` includes production security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
