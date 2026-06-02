# skyhouse-lab

Minimal React + Express TypeScript monorepo.

```
apps/
  web/   Vite + React + TS  (http://localhost:5173)
  api/   Express + TS       (http://localhost:3001)
```

Vite proxies `/api/*` to the Express server in dev.

## Quick start

```sh
npm install
npm run dev
```

Open http://localhost:5173.

## Scripts

- `npm run dev` — run both apps in parallel
- `npm run build` — type-check and emit both apps
- `npm run start` — run the built API server
