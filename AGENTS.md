# SaveState repository guide

This repo is a pnpm workspace containing a reusable library in `packages/savestate` and a documentation app in `apps/docs`.

## Mission

- Keep the public API small, elegant, and type-safe.
- Prefer predictable, debounced save flows over complex state duplication.
- Treat offline, save, conflict, and retry behavior as first-class product concerns.
- Expose AI-readable metadata and explicit event APIs.

## Commands

- `pnpm install`
- `pnpm build`
- `pnpm test`
