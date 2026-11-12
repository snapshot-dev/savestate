'use client';

import {
  SaveBadge,
  SaveButton,
  SaveIndicator,
  SaveProgress,
  SaveStatus,
} from 'savestate';

export type SaveComponentPreviewName = 'indicator' | 'badge' | 'button' | 'progress' | 'status';

export function SaveComponentPreview({ name }: { name: SaveComponentPreviewName }) {
  switch (name) {
    case 'indicator':
      return <SaveIndicator state="saved" variant="solid" showTimestamp={false} />;
    case 'badge':
      return (
        <>
          <SaveBadge state="saved" variant="solid" />
          <SaveBadge state="error" variant="solid" />
        </>
      );
    case 'button':
      return <SaveButton state="saving" variant="primary" />;
    case 'progress':
      return <SaveProgress state="saving" progress={42} label="Uploading document" />;
    case 'status':
      return (
        <SaveStatus
          state="error"
          error="The server could not be reached. Your draft is still available."
          onRetry={() => undefined}
        />
      );
  }
}
