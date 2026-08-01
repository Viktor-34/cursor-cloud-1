# Aethos — Clip-Mask Page Transition

Static HTML / CSS / JS adaptation of the Codegrid Next.js clip-mask page transition demo (`codegrid-next-clip-mask-page-transition`).

## Pages

- `/` — Genesis
- `/gateway` — Gateway
- `/colony` — Colony

Brand: **Aethos**. Navigation stays fixed during transitions via `view-transition-name: navbar`. Page heroes animate with a clip-mask enter / fade-slide exit (View Transitions API).

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx --yes serve .
```

View Transitions work best in Chromium-based browsers.

## Stack

- HTML pages (no React / Next.js)
- CSS View Transitions (`@view-transition`)
- Google Fonts: WDXL Lubrifont SC, Instrument Sans
