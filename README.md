# Japan 2026

A phone-first guide to saved places in Japan. It's a plain static website with no build step: open `index.html` and it works.

It has five tabs:

- **Shopping:** second-hand shops, books, art and synth shops
- **To see:** museums, sights, neighbourhoods, markets and galleries, Kyoto
- **Adventures:** the Northern Alps hike and day trips
- **Food & bars:** restaurants, bars and live music
- **Map:** every saved place as a coloured pin, plus live location and the places closest to you

It installs on Android as an app (Chrome → ⋮ → Add to home screen) and keeps working offline.

## Deploy to GitHub Pages

With the [GitHub CLI](https://cli.github.com/) installed and logged in (`gh auth login`), run this from this folder:

```bash
git init
git add .
git commit -m "Japan 2026"
gh repo create japan-2026 --public --source=. --push
gh api -X POST repos/{owner}/japan-2026/pages -f "source[branch]=main" -f "source[path]=/"
```

After a minute or two the site is live at `https://<your-username>.github.io/japan-2026/`.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Location only works on `localhost` or `https`, not when you open the file directly.

## Files

| File | What it is |
|---|---|
| `index.html` | The page: all tab content and the map container |
| `styles.css` | Every style, including light and dark colours |
| `app.js` | Tabs, checklists, map, live location, "closest to you" |
| `places.js` | The places shown on the map (edit this to add, move or fix pins) |
| `sw.js` | Offline support: caches the page and the map areas you've viewed |
| `manifest.webmanifest`, `icon-*.png` | Lets the site install as an app |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

`data/` holds the source exports the places were built from. It is gitignored: the site never loads from it.

## Credits

The map uses [Leaflet](https://leafletjs.com/) with map tiles from [CARTO](https://carto.com/) and [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
