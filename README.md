# Last.fm Tracker

A personal Last.fm ranking tracker that shows your top artists and tracks with position evolution over time.

Data is synced daily via GitHub Actions and served as static JSON files — no backend in production.

## How it works

```
GitHub Actions (daily cron)
  → fetches Last.fm API
  → saves snapshot JSON to frontend/public/data/snapshots/
  → commits to repo
  → Vercel detects commit → redeploys frontend
```

The frontend reads those static JSON files directly, so there's no server required in production.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Recharts
- **Sync script:** Node.js + tsx (runs in GitHub Actions)
- **Dev backend:** Express (local only, for testing without Actions)
- **Hosting:** Vercel (frontend) + GitHub Actions (daily sync)

## Features

- Top artists and tracks with all-time scrobble counts
- Position trend indicators (rising ↑, falling ↓, new ★, stable)
- Active listening indicator (pulsing dot when scrobbled in the comparison period)
- Period comparison: previous snapshot / 7d / 30d / 90d / 180d / 365d / all-time / specific date
- Position history charts per artist/track (click any row to expand)
- Pagination (50 items per page)
- Search and filter by trend or listening activity

## Setup

### 1. Fork or clone this repo

```bash
git clone https://github.com/YOUR_USERNAME/lastfm-tracker
cd lastfm-tracker
```

### 2. Get a Last.fm API key

1. Go to [last.fm/api/account/create](https://www.last.fm/api/account/create)
2. Fill in any application name (e.g. "my tracker")
3. Copy the **API key** (not the Shared Secret)

### 3. Configure GitHub secrets and variables

In your repo: **Settings → Secrets and variables → Actions**

**Secrets:**
| Name | Value |
|---|---|
| `LASTFM_USERNAME` | Your Last.fm username |
| `LASTFM_API_KEY` | Your Last.fm API key |

**Variables (optional):**
| Name | Value |
|---|---|
| `MAX_PAGES` | Max pages to fetch per sync (`0` = no limit, 1000 items/page) |

### 4. Allow Actions to write to the repo

**Settings → Actions → General → Workflow permissions** → select **Read and write permissions**

### 5. Run the first sync manually

**Actions tab → "Daily Last.fm Sync" → Run workflow**

This will generate the first snapshot and commit it to `frontend/public/data/snapshots/`.

### 6. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project → import this repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_GITHUB_ACTIONS_URL` = `https://github.com/YOUR_USERNAME/lastfm-tracker/actions`
4. Deploy

After that, every daily sync commit will trigger an automatic Vercel redeploy.

## Local development

```bash
# Install all dependencies
npm install

# Copy and configure backend settings
cp backend/data/config.example.json backend/data/config.json
# Edit config.json with your username and API key

# Start dev server (frontend + backend)
npm run dev
```

The dev mode runs a local Express backend so you can sync and test without GitHub Actions.

## Data structure

Snapshots are saved as:

```
frontend/public/data/
  config.json                        ← public config (username, last sync date)
  snapshots/
    index.json                       ← list of available snapshot dates
    2024-01-15.json                  ← daily snapshot
    2024-01-16.json
    ...
```

Each snapshot contains the full ranked list of artists and tracks at the time of sync.

## Sync schedule

The GitHub Actions workflow runs daily at **06:00 UTC** (03:00 BRT). You can also trigger it manually from the Actions tab at any time.
