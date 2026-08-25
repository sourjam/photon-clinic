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

## Live API seams

The app renders in fixture mode when OpenAI or Photon credentials are not configured. Fixture mode is labeled in the
header and uses the same route boundaries as live mode.

Set local values in an ignored `.env.local` file or Cloudflare Worker secrets:

```sh
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
PHOTON_CLIENT_ID=
PHOTON_CLIENT_SECRET=
PHOTON_TOKEN_URL=https://auth.neutron.health/oauth/token
PHOTON_AUDIENCE=https://api.neutron.health
PHOTON_API_URL=https://api.neutron.health/graphql
PHOTON_CATALOG_API_URL=https://clinical-api.neutron.health/graphql
PHOTON_AUTH_TOKEN=
```

The MVP syncs patient and treatment context only. It does not create prescriptions or request prescribing scope.
