# Japan 2026

A phone-first guide to saved places in Japan. It's a plain static website with no build step and no framework: the files are served as they are.

It has five tabs:

- **Shopping:** second-hand shops, books, art and synth shops
- **To see:** museums, sights, neighbourhoods, markets and galleries, Kyoto
- **Adventures:** day trips out of Tokyo
- **Food & bars:** restaurants, bars and live music
- **Map:** every saved place as a coloured pin, plus live location and the places closest to you

It installs as an app from the browser's menu (Add to home screen). The lists, notes and Google Maps links keep working with no signal. The map itself needs a connection, because Google's tiles cannot be cached.

## Google Maps key

The map is the [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript). It needs an API key and a map ID, both in `config.js`. They are public by design: the key is restricted by HTTP referrer in the Google Cloud console to the domain the site is served from, which is what stops anyone else spending the quota. Add `http://localhost:*` to those referrers to work on it locally.

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

Then open http://localhost:8000. Location only works on `localhost` or `https`, not when you open the file directly, and the map only loads if `localhost` is one of the key's allowed referrers.

## Files

| File | What it is |
|---|---|
| `index.html` | The page: all tab content and the map container |
| `styles.css` | Every style, including light and dark colours |
| `app.js` | Tabs, map, category filters, live location, "closest to you" |
| `places.js` | The places shown on the map (edit this to add, move or fix pins) |
| `sw.js` | Offline support: caches the page and its files. Bump the cache name when you change any of them |
| `manifest.webmanifest`, `icon-*.png` | Lets the site install as an app |
| `config.js` | The Google Maps API key and map ID |
| `vendor/` | The Atkinson Hyperlegible font files, served from here rather than Google Fonts |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

`data/` holds the source exports the places were built from. It is gitignored: the site never loads from it.

## Credits

The map is the [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript). The typeface is [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) from the Braille Institute.
