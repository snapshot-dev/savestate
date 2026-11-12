# SaveState library

The library package owns the hook, state-machine, and component exports.

Keep these principles:

- Preserve simple TypeScript ergonomics.
- Ensure save operations never mark a newer value as saved just because an older request succeeded.
- Keep all transitions explicit and documented.
- Export metadata that reflects the implementation accurately.
