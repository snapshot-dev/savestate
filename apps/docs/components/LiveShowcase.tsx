'use client';

import { useEffect, useState } from 'react';
import {
  SaveBadge,
  SaveButton,
  SaveIndicator,
  SaveProgress,
  SaveStatus,
} from 'savestate';
import type { SaveStateStatus as Status } from 'savestate';

const states: Status[] = ['idle', 'dirty', 'saving', 'saved', 'error', 'offline', 'syncing', 'conflict'];
const stateLabels: Record<Status, string> = {
  idle: 'Idle',
  dirty: 'Unsaved',
  saving: 'Saving',
  saved: 'Saved',
  error: 'Error',
  offline: 'Offline',
  syncing: 'Syncing',
  conflict: 'Conflict',
};

export function LiveShowcase() {
  const [status, setStatus] = useState<Status>('saved');
  const [previewSavedAt, setPreviewSavedAt] = useState<number | null>(null);
  useEffect(() => setPreviewSavedAt(Date.now()), []);

  return (
    <div className="live-showcase">
      <div className="showcase-controls">
        <div><strong>Choose a state</strong><span>Preview each lifecycle moment</span></div>
        <div className="state-picker" role="group" aria-label="Select save state">
          {states.map((item) => (
            <button type="button" className={status === item ? 'is-selected' : ''} key={item} onClick={() => setStatus(item)}>
              <span className={`picker-dot picker-dot--${item}`} />{stateLabels[item]}
            </button>
          ))}
        </div>
      </div>

      <div className="showcase-surfaces">
        <article className="surface-card surface-card--indicator">
          <div className="surface-label">INDICATOR · DEFAULT</div>
          <SaveIndicator state={status} lastSavedAt={status === 'saved' ? previewSavedAt : null} error={status === 'error' ? 'Your changes could not be saved.' : null} />
          <div className="surface-label surface-label--secondary">SOFT · GHOST · MINIMAL · OUTLINE</div>
          <div className="variant-row">
            {(['soft', 'ghost', 'minimal', 'outline'] as const).map((variant) => (
              <SaveIndicator key={variant} state={status} variant={variant} showTimestamp={false} />
            ))}
          </div>
        </article>

        <article className="surface-card surface-card--components">
          <div className="surface-label">COMPONENTS</div>
          <div className="component-row"><SaveBadge state={status} variant="soft" /><SaveBadge state={status} variant="outline" /><SaveBadge state={status} variant="solid" /></div>
          <SaveProgress state={status} progress={status === 'saving' || status === 'syncing' ? null : status === 'saved' ? 100 : 42} label={status === 'saved' ? 'Document saved' : 'Document upload'} />
          <SaveButton state={status} onSave={() => setStatus('saving')} onRetry={() => setStatus('saving')} retryable />
        </article>
      </div>

      <article className="surface-card timeline-card">
        <div className="surface-label">STATUS DETAILS</div>
        <div className="timeline-grid">
          <SaveStatus state={status} error={status === 'error' ? 'Network request timed out. Your draft is still here.' : null} lastSavedAt={status === 'saved' && previewSavedAt != null ? previewSavedAt - 45_000 : null} onRetry={() => setStatus('saving')} />
        </div>
      </article>
    </div>
  );
}
