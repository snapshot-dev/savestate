# Save State

Save State is a React library for modeling and displaying save lifecycle states.

The UI focuses on save feedback only; it is not a general-purpose toast or notification library.

## Install

```bash
pnpm add @checkpoint-dev/savestate
```

## Usage

```tsx
import { SaveIndicator, useSaveState } from '@checkpoint-dev/savestate';
import '@checkpoint-dev/savestate/styles.css';

const save = useSaveState({
  initialValue: 'Hello world',
  debounce: 500,
  onSave: async (value) => {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!response.ok) throw new Error('Save failed.');
  },
});
```

## Components

- `SaveIndicator` — inline status, with default, soft, ghost, outline, minimal, and solid variants
- `SaveBadge` — status badge with soft, outline, and solid variants
- `SaveButton` — save/retry action with primary, secondary, outline, and ghost variants
- `SaveProgress` — determinate or indeterminate save progress
- `SaveStatus` — detailed state, optional error and retry action
