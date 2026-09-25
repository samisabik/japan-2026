# CLAUDE.md

Context for Claude Code working in this repo.

## What this is

A guide to saved places in Japan, used on a phone at about 412px wide, often installed to the home screen. It's hosted on GitHub Pages as a static site with no build step and no framework. Keep it that way: plain HTML, CSS and ES5-style JavaScript.

**This repo is public.** Keep travel dates, flight times, accommodation, addresses and anything else that says who goes where and when out of the site, the docs and the commit messages.

## Design rules

The page is built for fast reading on a phone. Keep it:

- **Plain and calm:** one readable font (Atkinson Hyperlegible, served from `vendor/`, not from Google Fonts), large text, generous line spacing, left-aligned, one column.
- **Low on decoration:** no extra colour-coding, badges, labels or icons beyond what exists. One colour per category, used on the map pins and on the matching tab, always next to a text label.
- **Short copy:** one short line per place. Plain words, sentence case, no filler.
- **Big tap targets:** at least 44px. The bottom tab bar stays reachable with a thumb.
- **Dark mode:** follows the phone setting via the CSS tokens on `:root`.

## Structure

- `index.html`: all tab content as static HTML. There are five tab panels (`#p-shopping`, `#p-see`, `#p-adventures`, `#p-other`, `#p-map`) and a bottom `<nav class="tabs">`. The map tab drops the page padding (`body.maptab`). There is no page header.
- `places.js`: `window.PLACES`, an array of `{id, name, note, cat, lat, lng, approx, url}`.
  - `cat` is one of `shopping`, `see`, `adventures` or `other` (food and bars). It must match the tab the place appears on.
  - `url` is the Google Maps place link for the place. It is always exact, so the "Open in Google Maps" button is trustworthy even when the pin isn't.
  - `approx: true` means the coordinates are a best guess, which the popup says. The pin looks like any other: the dotted outline it used to draw was too faint to read on the map. The coordinates were decoded from the hex IDs in the Maps URLs, which is often exact but sometimes several km off. Fixing the approximate ones from their addresses and setting `approx: false` is a welcome improvement.
  - `id` must be unique. List items link to the map with `<button class="pin" data-id="…">`.
- `app.js`: one IIFE containing the tabs (URL hash + localStorage), the Google map, category filter chips, live location via `watchPosition`, and the "Closest to you" card. The Maps JavaScript API is fetched on demand the first time the map tab opens, so everything that touches the map goes through `initMap()`, which returns a promise.
- `config.js`: the Maps API key and map ID. Public on purpose, see the README.
- `styles.css`: design tokens on `:root`, with dark-mode overrides.
- `sw.js`: the service worker. Same-origin files are fetched network-first with a cache fallback, so the lists work with no signal. Google requests pass straight through, because their tiles must not be cached and the map cannot work offline. **Bump the cache name (`japan2026-shell-vN`) whenever you change any cached file.**
- `data/`: source material, gitignored. The site doesn't load anything from here.

## Adding a place

1. Add the entry to `places.js` with a new unique `id` and the right `cat`.
2. Add a `<li>` in the matching tab section of `index.html`: the name as a link to the Google Maps `url`, a pin button with the same `data-id`, and an optional `<span class="note">`.
3. Bump the service worker cache version.

## Checking your work

Test at a 412×915 mobile viewport. Check that nothing scrolls sideways, the bottom bar doesn't cover content, and the map fills the space above the bar. Location needs `http://localhost` or https, and the map needs that origin to be an allowed referrer on the API key.
