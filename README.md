[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/zero-two-1836/palmetto-platinum/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/zero-two-1836/palmetto-platinum/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Palmetto Platinum — GTA VI Trophy Guide & Tracker

A free, offline guide and tracker for the 55 PlayStation 5 trophies of
*Grand Theft Auto VI*: every trophy with its official name, description and
grade, a guide to each written for this app with its sources cited beside it,
a five-phase roadmap to the platinum, the game's single missable flagged with
a protection plan, and a checklist whose progress is saved in the browser.

## What it does

- **Tracker** — all 55 trophies grouped by roadmap phase, each with its
  official description, grade, kind, time estimate and (where PlayStation
  tracks one) a live counter: 42 Shooting Range challenges, 18 meditation
  spots, 250 stunts, 500 choices, and the rest. Mark trophies earned, step
  counters up and down, and a counter that reaches its target earns its
  trophy on its own.
- **Filters and search** — by kind (story, activities, collectibles, crime,
  grind, missable), by grade, by text, plus a hide-earned switch.
- **Spoiler shield** — hides the names and descriptions of the 28 hidden
  trophies' story entries until they are earned, so the list can be used
  mid-playthrough without spoiling the plot.
- **Roadmap to Platinum** — the whole run on one page: 4/10 difficulty,
  ≈ 200 hours, 1 playthrough, 0 online trophies, and the five phases in the
  order to play them, each with its own progress bar.
- **Missables** — the one missable trophy (a Chapter 1 moment on Ocean
  Beach) with its full guide, a five-step protection plan, and an honest
  list of trophies that look missable but are not.
- **Export / import / reset** — progress lives only in localStorage; export
  it to a JSON file and import it on another browser whenever you like.

## The data

`app/data/trophies.json` holds the list. Trophy **names, descriptions and
grades are the official PlayStation list**, shown exactly as published —
28 of the 55 are hidden, and exactly one is missable. Everything else in
the file — the guide, the steps, the watch-out note, the time estimate,
the roadmap phase — is written for this app. Each guide names its sources
(PlayStation for the official text; PowerPyx, PSNProfiles, Exophase and
TrueTrophies for counts, flags and cross-checks) and links them beside the
trophy: a source is cited, never copied.

## Run it

Serve the `app/` folder with any static file server and open it in a
desktop browser — it works fully offline and loads nothing from the
network. For a quick local look:

```
node serve.ts        # then open http://localhost:8080/
```

## Handing it in (make.fun)

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes the dossier with the kit's vendored library:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The four screenshots in `screenshots/` are real renders of the app in a
seeded demo state (some trophies earned, counters under way), produced by
`tools/take-screenshots.mjs`, which drives headless Chromium against
`serve.ts` using the views listed in `shots.json`. The `?demo=1` URL
parameter shows that same demo state in a browser.

## Files

- `app/index.html`, `app/style.css` — the page and its look
- `app/main.js` — boot, filters and wiring
- `app/views.js` — rendering: list, detail panel, roadmap, missables
- `app/tracker.js` — progress state, counters, export/import
- `app/data/trophies.json` — the 55 trophies and their guides
- `main.ts`, `serve.ts`, `shots.json` — entry program, local server, shot list
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged
- `tools/take-screenshots.mjs` — the screenshot tool

## License

MIT — see `LICENSE`.
