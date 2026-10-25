# DevShow

**Show your code. Show your impact.**

DevShow turns a GitHub profile URL into a polished developer dashboard: profile, commit stats, a GitHub-style contribution heatmap, monthly activity, top repositories and recent commits.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add GITHUB_TOKEN
npm run dev
```

Open http://localhost:3000, paste `https://github.com/username`, and DevShow takes you to `/github/username`.

### `GITHUB_TOKEN` (recommended)

DevShow works without a token, but adding one:

- raises GitHub's rate limit from 60 to 5,000 requests per hour, and 10 to 30 commit searches per minute
- uses the GraphQL contribution calendar instead of the public HTML calendar, and adds "top repositories by commits in the last year"

A classic or fine-grained personal access token with **no scopes** is enough for public data.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page with the GitHub profile input |
| `/github/[username]` | Developer dashboard (server-rendered, revalidated every 30 min). Old `/u/[username]` links redirect here |
| `/api/github/[username]` | The full dashboard payload as JSON (`400` invalid, `404` not found, `429` rate limited) |

## Where the data comes from

| Data | Source |
| --- | --- |
| Profile | REST `GET /users/:username` |
| Total commits and recent commits | REST commit search, `author:username` (public, default branches, all-time) |
| Heatmap | GraphQL `contributionsCollection` with a token. Without one, it reads the public contribution calendar at `github.com/users/:username/contributions`, and as a last resort it is built from recent commits |
| Streaks, active days, busiest day | Computed from the heatmap |
| Activity overview (Commits / Pull requests / Issues / Code review %) | GraphQL contribution totals with a token; otherwise the `data-percentages` attribute in the public calendar. Hidden if the user turned off "Activity overview" on GitHub |
| Achievements | Read from `github.com/:username?tab=achievements` (GitHub has no achievements API) |

GitHub responses are cached in the Next.js data cache for 30 minutes, and requests are deduplicated per render. If one part fails (for example, commit search is rate limited), the rest of the dashboard still renders and a notice explains what's missing.

## Project structure

```
src/
  app/
    page.tsx                     landing page
    github/[username]/           dashboard, loading skeleton, error and not-found states
    api/github/[username]/       JSON API route
  components/                    UI: heatmap, stat cards, commits, repos, form, states
  lib/
    github.ts                    GitHub REST/GraphQL client, caching, error mapping
    parse-github-url.ts          URL validation and username extraction
    stats.ts                     streaks, levels, aggregation
```

## Year selector

The contribution activity card has a dropdown with **Last 12 months** and every year from the year the account was created to now. The choice is stored in the URL (`/github/username?year=2024`), so a year view can be linked and shared. The heatmap, monthly bars, active days, streaks, busiest day and share card all follow the selected year. Total commits stays all-time. Top repositories follow the year only when `GITHUB_TOKEN` is set.

## Day / Night theme

A Day / Night switch sits in the header. Night is the default. A visitor's choice is saved in `localStorage` and applied by a small inline script before first paint, so the page never flashes the wrong theme. Colors are CSS variables in `globals.css`. The share card always renders in night colors so exported images stay consistent.

## Share & download

The **Share** button on a profile opens a dialog that renders a social-ready card and exports it in the browser (`html-to-image` + `jspdf`, both loaded only when you click a download):

| Size | Pixels | For |
| --- | --- | --- |
| Square | 1080×1080 | Instagram, LinkedIn |
| Portrait | 1080×1350 | Instagram feed (adds bio and top repositories) |
| Landscape | 1200×630 | X, LinkedIn, Facebook (full-year heatmap) |

Formats: **PNG** (lossless), **JPG** (95% quality), **PDF** (the page matches the card size and embeds a 2× image). The avatar is loaded through `/_next/image` so it's same-origin and can be drawn into the export.

## Notes

- The heatmap counts all contributions (commits, PRs, issues, reviews), as GitHub's own graph does. **Total Commits** counts commits only.
- Private contributions appear only if the user has turned on "private contributions" on their GitHub profile.
- Set `NEXT_PUBLIC_SITE_URL` in production so Open Graph URLs are absolute.
"# devshow" 
