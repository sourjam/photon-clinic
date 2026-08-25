# vinext app

This project was created with create-vinext-app.

## Scripts

- `pnpm run dev` starts the vinext dev server.
- `pnpm run build` builds the Cloudflare Worker output.
- `pnpm run start` starts the built Worker locally with Wrangler.
- `pnpm run deploy` deploys the Cloudflare Worker.

## Prototype Controls

The V2 visit workspace includes a dark prototype state switcher for demo and QA only. It is visible
in development. To include it in a production preview build for an interview demo, set:

```sh
VITE_SHOW_PROTOTYPE_CONTROLS=true
```
