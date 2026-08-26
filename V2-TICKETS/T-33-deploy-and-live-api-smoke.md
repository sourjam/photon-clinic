# T-33 - Deploy and live API smoke tests

**Phase:** Functionality-first V2.1 · **Depends on:** T-32 · **Blocks:** final demo confidence
**Read first:** `T-00-design-reference.md`, `T-19-server-action-seams.md`, `T-29-lite-treatment-search.md`, `T-30-lite-patient-form-and-dynamic-sync.md`, `T-32-lite-blank-slate-visit.md`

---

## Context

Vitest route tests currently mock the Photon/OpenAI network boundary. They prove that dynamic
patient/treatment payloads are shaped correctly, but they do not prove that the deployed Cloudflare
Worker has the right secrets or that live Photon/OpenAI calls work from production.

This ticket adds an opt-in smoke suite for the deployed app. It should not run on every commit,
because the Photon patient sync test creates sandbox patient records.

---

## Goal

Deploy the current app and add a small smoke-test command that verifies deployed API/data flow
against a configured base URL.

The suite should verify confidence-critical seams only. It is not a broad browser E2E rewrite.

---

## Proposed Command

```bash
SMOKE_BASE_URL=https://photon-clinic.jimyyang-cf.workers.dev LIVE_SMOKE=1 npm run test:smoke
```

Without `LIVE_SMOKE=1`, the smoke command should skip live-write tests or exit with a clear message.

---

## Smoke Coverage

Required:

- deployed app returns `200`
- `GET /api/photon/treatments?term=hydrocortisone` returns a valid response shape
- `POST /api/photon/sync` with a unique generated patient returns a patient ID
- re-posting the same generated `externalId` returns the same/update path instead of blindly
  duplicating
- `POST /api/instructions` with new patient, treatment, note, and visit context returns Spanish
  instruction output

Optional browser check:

- open the deployed app
- click `New visit`
- confirm the UI enters blank visit mode

---

## Guardrails

- Use a distinct external ID prefix, e.g. `phoclinic2-smoke-{timestamp}-{uuid}`.
- Do not run live-write tests unless `LIVE_SMOKE=1` is set.
- Do not commit real credentials.
- Do not require live smoke tests in `npm run test`.
- Keep Playwright/API assertions focused on response shape and flow success, not brittle copy.
- If Photon has no delete/cleanup endpoint available, document that the smoke test creates sandbox
  patient records.

---

## Acceptance Criteria

- [ ] App is deployed to the configured Cloudflare Worker.
- [ ] `npm run test:smoke` exists.
- [ ] Smoke tests accept `SMOKE_BASE_URL`.
- [ ] Live-write smoke tests require `LIVE_SMOKE=1`.
- [ ] Random/unique patient sync succeeds against deployed API when live credentials are configured.
- [ ] Re-syncing the same smoke patient is idempotent or updates the existing record.
- [ ] Treatment lookup and instruction generation smoke tests pass.
- [ ] Normal unit/integration test suite remains fixture/mocked and fast.
- [ ] README documents when and how to run smoke tests.

## Out Of Scope

- full E2E suite
- visual regression tests
- broad Playwright coverage of every card
- persistent smoke-test cleanup unless Photon exposes an appropriate endpoint
- running smoke tests in every PR by default
- prescription creation
