# Design

## Context

- Desktop has no header; `Sidebar` renders in three modes (`full`, `rail`, `drawer`) and holds the brand row and tool list. The mobile drawer reuses `Sidebar`, so anything added there reaches all three modes.
- Icons are stroke paths on a 24×24 grid rendered by `Icon` (`fill="none"`, `stroke="currentColor"`).
- `scanDist` fails the build on any absolute `http(s)` URL not in `ALLOWED_URLS`. The repository URL would be reported as a third-party URL.

## Goals / Non-Goals

**Goals:**
- One footer link in `Sidebar` that adapts to each mode, matching existing row and rail-link styles.
- Keep the dist scan strict: allow only this one URL.

**Non-Goals:**
- Star counts, version badges or anything fetched from GitHub (would need a runtime request, forbidden by the CSP).
- A link in the mobile top bar; the drawer already shows it.

## Decisions

| Decision | Why | Rejected | Recorded in |
| --- | --- | --- | --- |
| Link pinned at the bottom of `Sidebar` (`margin-top: auto`), label "GitHub" with icon; icon-only with `aria-label`/`title` in the rail | Desktop has no header; the sidebar is shared by all modes so one element covers desktop, rail and mobile | Icon in the brand row (crowds the collapse button, stacks in rail); a new desktop header | `docs/tech/architecture.md` Decisions |
| Outline GitHub mark (Feather path, MIT) added to `icons` | Matches the stroke icon set and `Icon` component; no dependency | GitHub's filled mark (would need a fill variant of `Icon`); an icon library | — (implementation detail) |
| `target="_blank" rel="noopener noreferrer"` | Keeps the user's chain and input open; no referrer leaves the app | Same-tab navigation | — (spec) |
| Allow exactly `https://github.com/vienhx/dev-utils` in `ALLOWED_URLS`, anchored regex | It is navigation, never fetched; an exact match keeps the scan catching any other GitHub URL (e.g. raw content or scripts) | Allowing `github.com/*`; skipping the scan for `href` values | `docs/tech/architecture.md` Decisions |

## Risks / Trade-offs

- [Repository renamed or moved] → The URL lives in two places (`Sidebar` and `ALLOWED_URLS`); a mismatch fails `pnpm check:dist`, so drift is caught at build time.
- [Footer pushed off-screen when many templates are listed] → `Sidebar` already scrolls (`overflow-y: auto`), so the link is reachable by scrolling; acceptable for a secondary link.
- [Rail mode sets `overflow: visible` for flyouts] → The footer uses the same column flex layout, so `margin-top: auto` still pins it to the bottom.
