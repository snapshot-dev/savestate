'use client';

import { useState } from 'react';
import { Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { SaveButton, SaveIndicator, SaveStatus, useSaveState } from 'savestate';

export function SavePlayground() {
  const [previewError, setPreviewError] = useState<Error | null>(null);
  const save = useSaveState({
    initialValue: 'A thoughtful save state makes every change feel safe.',
    debounce: 900,
    onSave: async () => {
      await new Promise((resolve) => setTimeout(resolve, 750));
    },
  });
  const error = previewError ?? save.error;
  const status = previewError ? 'error' : save.status;

  return (
    <Card size="4" variant="surface">
      <Flex direction="column" gap="4">
        <Flex align="center" justify="between" gap="3" wrap="wrap">
          <Heading as="h2" size="4">Try the save flow</Heading>
          {status !== 'error' && <SaveIndicator state={status} lastSavedAt={save.lastSavedAt} />}
        </Flex>
        <label>
          <textarea
            className="ss-demo-textarea"
            value={save.value}
            onChange={(event) => {
              setPreviewError(null);
              save.setValue(event.target.value);
            }}
            aria-label="Interactive draft editor"
          />
        </label>
        <Flex align="center" gap="3" wrap="wrap">
          <SaveButton state={save.status} onSave={save.save} onRetry={save.retry} retryable />
          <Button
            type="button"
            variant="soft"
            color="red"
            onClick={() => setPreviewError(new Error('The demo request failed. Your draft is still here.'))}
          >
            Preview an error
          </Button>
        </Flex>
        {error && (
          <SaveStatus
            state="error"
            error={error}
            onRetry={() => {
              setPreviewError(null);
              if (save.error) void save.retry();
            }}
          />
        )}
      </Flex>
    </Card>
  );
}
