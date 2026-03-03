# API Docs (OpenAPI 3.0)

One file per endpoint. To add docs:

1. Create `paths/<domain>/<endpoint>.path.ts` (e.g. `paths/subscriptions/checkout.path.ts`)
2. Export `PathsObject` with your path
3. Add to `paths/index.ts`: `mergePaths(..., newPath)`
