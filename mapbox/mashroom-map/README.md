# 🍄 Mushroom Map — static interactive mushroom encyclopedia

A **fully static** (no server) build, exported from a Next.js + PostGIS project.
Live at: https://kumpinar.github.io/mapbox/mashroom-map/

## What it is
- **577 mushroom species** with photos, taxonomy, edibility, season and a global
  occurrence map (**30,807** records).
- **Client-side clustering** with Mapbox GL (GeoJSON `cluster: true`) — no backend.
- Filter by edibility / family, live search, per-species detail pages (gallery,
  poison band, poisonous look-alikes, season, occurrence mini-map), fullscreen map.
- English UI. "Liquid Glass" (glassmorphism) design.

## Safety
Edibility for the ~444 bulk-imported species is shown as **“Unknown (unverified)”** —
their edibility has **not** been confirmed. The 133 curated species carry human-verified
edibility. Never eat any mushroom based on this site.

## Structure (self-contained, relative paths)
```
index.html          app shell (header, disclaimer, footer)
css/styles.css      Liquid Glass styles
js/app.js           client app: list/filter/search/detail + Mapbox clustering
data/
  species.json      577 species (full detail, English)
  occurrences.geojson  30,807 points for the clustered map
uploads/<slug>/*.jpg  photos (≤5 per species)
```
No build step, no server: open `index.html` (via any static host) and it works.

## Data
Photos © their authors (Creative Commons). Data from **iNaturalist** & **GBIF**.
