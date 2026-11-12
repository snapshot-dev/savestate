import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSaveState } from '../src/react/useSaveState';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('useSaveState', () => {
  it('debounces and saves the latest value', async () => {
    const saves: string[] = [];

    function Editor() {
      const save = useSaveState<string>({
        initialValue: 'start',
        debounce: 25,
        autoSave: true,
        onSave: async (value) => {
          saves.push(value);
        },
      });

      return (
        <div>
          <textarea value={save.value} onChange={(event) => save.setValue(event.target.value)} />
          <span data-testid="status">{save.status}</span>
        </div>
      );
    }

    render(<Editor />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'draft-1' } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'draft-2' } });

    await waitFor(() => {
      expect(saves).toContain('draft-2');
    });
  });

  it('reports an error on save failure', async () => {
    const onError = vi.fn();

    function Editor() {
      const save = useSaveState<string>({
        initialValue: 'hello',
        debounce: 0,
        onSave: async () => {
          throw new Error('boom');
        },
        onError,
      });

      return <textarea value={save.value} onChange={(event) => save.setValue(event.target.value)} />;
    }

    render(<Editor />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'updated' } });

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('serializes saves and persists the latest edit after an in-flight save', async () => {
    const firstSave = deferred<void>();
    const secondSave = deferred<void>();
    const savedValues: string[] = [];
    let activeSaves = 0;
    let maxActiveSaves = 0;

    const onSave = vi.fn(async (value: string) => {
      activeSaves += 1;
      maxActiveSaves = Math.max(maxActiveSaves, activeSaves);
      savedValues.push(value);
      try {
        await (savedValues.length === 1 ? firstSave.promise : secondSave.promise);
      } finally {
        activeSaves -= 1;
      }
    });

    function Editor() {
      const save = useSaveState({
        initialValue: 'start',
        debounce: 5,
        onSave,
      });

      return <textarea value={save.value} onChange={(event) => save.setValue(event.target.value)} />;
    }

    render(<Editor />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'first draft' } });
    await waitFor(() => expect(savedValues).toEqual(['first draft']));

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'latest draft' } });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(savedValues).toEqual(['first draft']);

    await act(async () => {
      firstSave.resolve();
      await firstSave.promise;
    });
    await waitFor(() => expect(savedValues).toEqual(['first draft', 'latest draft']));
    expect(maxActiveSaves).toBe(1);

    await act(async () => {
      secondSave.resolve();
      await secondSave.promise;
    });
  });

  it('does not cancel autosave when local config is supplied inline', async () => {
    const onSave = vi.fn();

    function Editor() {
      const save = useSaveState({
        initialValue: 'start',
        debounce: 5,
        local: { enabled: true, key: 'inline-config' },
        onSave,
      });

      return <textarea value={save.value} onChange={(event) => save.setValue(event.target.value)} />;
    }

    render(<Editor />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'draft' } });

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('draft'));
  });

  it('keeps a recovered local draft marked as unsaved', async () => {
    window.localStorage.setItem('recovery-test', JSON.stringify('recovered draft'));

    function Editor() {
      const save = useSaveState({
        initialValue: 'server value',
        autoSave: false,
        local: { enabled: true, key: 'recovery-test' },
        onSave: async () => undefined,
      });

      return (
        <>
          <textarea value={save.value} onChange={(event) => save.setValue(event.target.value)} />
          <span data-testid="status">{save.status}</span>
          <span data-testid="dirty">{String(save.isDirty)}</span>
        </>
      );
    }

    render(<Editor />);
    await waitFor(() => {
      expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('recovered draft');
    });
    expect(screen.getByTestId('status').textContent).toBe('dirty');
    expect(screen.getByTestId('dirty').textContent).toBe('true');
    window.localStorage.removeItem('recovery-test');
  });

  it('cancels the debounce without hiding the unsaved state', async () => {
    const onSave = vi.fn();

    function Editor() {
      const save = useSaveState({
        initialValue: 'start',
        debounce: 100,
        onSave,
      });

      return (
        <>
          <textarea value={save.value} onChange={(event) => save.setValue(event.target.value)} />
          <button type="button" onClick={save.cancel}>Cancel pending save</button>
          <span data-testid="status">{save.status}</span>
        </>
      );
    }

    render(<Editor />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel pending save' }));

    expect(screen.getByTestId('status').textContent).toBe('dirty');
    await act(async () => new Promise((resolve) => setTimeout(resolve, 120)));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('preserves the latest edit when an asynchronous offline check completes', async () => {
    const offlineCheck = deferred<boolean>();

    function Editor() {
      const save = useSaveState({
        initialValue: 'start',
        autoSave: false,
        offlineCheck: () => offlineCheck.promise,
        onSave: async () => undefined,
      });

      return (
        <>
          <textarea value={save.value} onChange={(event) => save.setValue(event.target.value)} />
          <button type="button" onClick={() => void save.save()}>Save</button>
          <span data-testid="status">{save.status}</span>
        </>
      );
    }

    render(<Editor />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'first draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'latest draft' } });

    await act(async () => {
      offlineCheck.resolve(false);
      await offlineCheck.promise;
    });

    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('latest draft');
    expect(screen.getByTestId('status').textContent).toBe('offline');
  });
});
