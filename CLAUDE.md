# CLAUDE.md

Static trip map for Japan, on GitHub Pages. Plain HTML, CSS and ES5-style JS, no build step. Phone-first, about 412px wide.

**Public repo.** No dates, flight times, accommodation or addresses, in the site, this file or commit messages.

- `places.js`: `window.PLACES`, each `{id, name, note, cat, lat, lng, approx, url}`. `cat` is `shopping`, `see`, `adventures` or `other`, and must match the tab the place is listed on. `url` is always exact even when `lat`/`lng` are a guess (`approx: true`, which the popup says).
- `index.html`: five tab panels plus the bottom nav. List items link to the map with `<button class="pin" data-id="…">`.
- `app.js`: tabs, map, category chips, live location. The Maps JS API loads on demand, so anything touching the map goes through `initMap()`, which returns a promise.
- `config.js`: Maps API key and map ID. Public on purpose, restricted by HTTP referrer in the Google Cloud console.
- `map-style.json`: the base map style. The map uses a map ID, so `styles` in code is ignored and this has to be imported in the Cloud console under Map Styles, then attached to the map ID. Keep this file in step with what is live there.
- `sw.js`: caches same-origin files so the lists work with no signal. Google requests pass through, so the map needs data. **Bump `japan2026-shell-vN` after changing any cached file.**
- One colour per category, on the pins and the matching tab. Keep it plain: short notes, big tap targets, dark mode from `:root`.

Adding a place: entry in `places.js`, matching `<li>` in the right panel, bump the cache version.
