import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  LocalPersistenceConfig,
  SaveSnapshot,
  SaveStateOptions,
  SaveStateStatus,
  StorageAdapter,
} from '../types/save-state';

const defaultCompare = <T,>(previous: T, next: T) => previous === next;

const createStorageAdapter = <T,>(
  key: string,
  serialize: (value: T) => string,
  deserialize: (raw: string) => T
): StorageAdapter<T> => ({
  getItem: (storageKey) => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(storageKey ?? key);
    if (raw == null) return null;
    try {
      return deserialize(raw);
    } catch {
      return null;
    }
  },
  setItem: (storageKey, value) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey ?? key, serialize(value));
  },
  removeItem: (storageKey) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(storageKey ?? key);
  },
});

export function useSaveState<T>(options: SaveStateOptions<T>) {
  const compare = options.compare ?? defaultCompare;
  const initialValue = options.initialValue;
  const [snapshot, setSnapshot] = useState<SaveSnapshot<T>>({
    value: initialValue,
    status: 'idle',
    isDirty: false,
    isSaving: false,
    isSaved: true,
    error: null,
    lastSavedAt: null,
    lastSavedValue: initialValue,
    localPersisted: false,
  });

  const snapshotRef = useRef(snapshot);
  const localConfigRef = useRef(options.local);
  localConfigRef.current = options.local;
  const compareRef = useRef(compare);
  compareRef.current = compare;

  const valueRef = useRef<T>(initialValue);
  const lastSavedRef = useRef<T>(initialValue);
  const versionRef = useRef(0);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const flushRef = useRef<(() => Promise<void>) | null>(null);
  const localKey = useMemo(() => options.storageKey ?? options.local?.key ?? 'savestate', [options.storageKey, options.local?.key]);
  const listenersRef = useRef({
    idle: [] as Array<(snapshot: SaveSnapshot<T>) => void>,
    dirty: [] as Array<(snapshot: SaveSnapshot<T>) => void>,
    saving: [] as Array<(snapshot: SaveSnapshot<T>) => void>,
    saved: [] as Array<(snapshot: SaveSnapshot<T>) => void>,
    failed: [] as Array<(snapshot: SaveSnapshot<T>, error?: unknown) => void>,
    offline: [] as Array<(snapshot: SaveSnapshot<T>) => void>,
    syncing: [] as Array<(snapshot: SaveSnapshot<T>) => void>,
    conflict: [] as Array<(snapshot: SaveSnapshot<T>) => void>,
    reset: [] as Array<(snapshot: SaveSnapshot<T>) => void>,
  });

  const notify = useCallback((eventName: keyof typeof listenersRef.current, nextSnapshot: SaveSnapshot<T>, error?: unknown) => {
    const handlers = listenersRef.current[eventName] ?? [];
    handlers.forEach((handler) => {
      if (eventName === 'failed') {
        (handler as (snapshot: SaveSnapshot<T>, error?: unknown) => void)(nextSnapshot, error);
      } else {
        handler(nextSnapshot);
      }
    });
  }, []);

  const updateSnapshot = useCallback((next: Partial<SaveSnapshot<T>> | ((prev: SaveSnapshot<T>) => Partial<SaveSnapshot<T>>)) => {
    setSnapshot((prev) => {
      const patch = typeof next === 'function' ? next(prev) : next;
      const nextState: SaveSnapshot<T> = {
        ...prev,
        ...patch,
      };
      snapshotRef.current = nextState;
      return nextState;
    });
  }, []);

  const localEnabled = options.local?.enabled ?? false;

  const applyLocalRestore = useCallback(() => {
    const local = localConfigRef.current;
    if (!local?.enabled || typeof window === 'undefined') return;

    const adapter = local.storage ?? createStorageAdapter(localKey, (value) => local.serialize ? local.serialize(value) : JSON.stringify(value), (raw) => {
      const parser = local.deserialize ?? JSON.parse;
      return parser(raw);
    });

    const restored = adapter.getItem(localKey);
    const processed = local.onRead ? local.onRead(restored) : restored;
    if (processed != null) {
      valueRef.current = processed;
      const isDirty = !compareRef.current(lastSavedRef.current, processed);
      updateSnapshot({
        value: processed,
        status: isDirty ? 'dirty' : 'idle',
        isDirty,
        isSaving: false,
        isSaved: !isDirty,
        lastSavedValue: lastSavedRef.current,
      });
    }
  }, [localEnabled, localKey, updateSnapshot]);

  useEffect(() => {
    mountedRef.current = true;
    applyLocalRestore();
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current != null) {
        globalThis.clearTimeout(timeoutRef.current);
      }
    };
  }, [applyLocalRestore]);

  const persistLocal = useCallback((value: T) => {
    const local = localConfigRef.current;
    if (!local?.enabled || typeof window === 'undefined') return;
    const adapter = local.storage ?? createStorageAdapter(localKey, (raw) => local.serialize ? local.serialize(raw) : JSON.stringify(raw), (raw) => {
      const parser = local.deserialize ?? JSON.parse;
      return parser(raw);
    });

    try {
      const prepared = local.onWrite ? local.onWrite(value) : value;
      adapter.setItem(localKey, prepared);
    } catch {
      // Safe fallback for unavailable browser storage.
    }
  }, [localEnabled, localKey]);

  const setValue = useCallback((nextValue: T) => {
    valueRef.current = nextValue;
    versionRef.current += 1;
    const isSameAsSaved = compare(lastSavedRef.current, nextValue);

    const nextState = {
      value: nextValue,
      status: isSameAsSaved ? 'saved' : 'dirty',
      isDirty: !isSameAsSaved,
      isSaving: false,
      isSaved: isSameAsSaved,
      error: null,
      lastSavedValue: lastSavedRef.current,
    } as const;

    updateSnapshot((prev) => ({ ...prev, ...nextState }));

    const currentSnapshot = { ...snapshotRef.current, ...nextState } as SaveSnapshot<T>;
    if (!isSameAsSaved) {
      notify('dirty', currentSnapshot);
    }

    if (options.onDirty) {
      options.onDirty(nextValue);
    }

    if (!options.enabled && options.enabled !== undefined) {
      return;
    }

    if (options.autoSave !== false) {
      if (timeoutRef.current != null) {
        globalThis.clearTimeout(timeoutRef.current);
      }
      const delay = options.debounce ?? 350;
      timeoutRef.current = globalThis.setTimeout(() => {
        if (flushRef.current) {
          void flushRef.current();
        }
      }, delay);
    }
  }, [compare, notify, options.autoSave, options.debounce, options.enabled, options.onDirty, updateSnapshot]);

  const runFlush = useCallback(async () => {
    if (!mountedRef.current) return;
    if (options.enabled === false) {
      const current = snapshotRef.current;
      updateSnapshot({ status: current.isDirty ? 'dirty' : 'idle', isSaving: false });
      return;
    }

    let checkpoint = valueRef.current;
    let checkpointVersion = versionRef.current;
    const pending = !compare(lastSavedRef.current, checkpoint);
    if (!pending) {
      const nextState = {
        ...snapshotRef.current,
        status: 'saved',
        isDirty: false,
        isSaving: false,
        isSaved: true,
        lastSavedValue: checkpoint,
        value: checkpoint,
      } as SaveSnapshot<T>;
      updateSnapshot(nextState);
      notify('saved', nextState);
      return;
    }

    try {
      const offlineCheck = options.offlineCheck ?? (() => (typeof navigator === 'undefined' || navigator.onLine !== false));
      const online = await Promise.resolve(offlineCheck());
      checkpoint = valueRef.current;
      checkpointVersion = versionRef.current;

      if (!online) {
        const nextState = {
          ...snapshotRef.current,
          status: 'offline',
          isDirty: !compare(lastSavedRef.current, checkpoint),
          isSaving: false,
          isSaved: compare(lastSavedRef.current, checkpoint),
          value: checkpoint,
        } as SaveSnapshot<T>;
        updateSnapshot(nextState);
        notify('offline', nextState);
        return;
      }

      const stillPending = !compare(lastSavedRef.current, checkpoint);
      if (!stillPending) {
        const nextState = {
          ...snapshotRef.current,
          status: 'saved',
          isDirty: false,
          isSaving: false,
          isSaved: true,
          lastSavedValue: checkpoint,
          value: checkpoint,
        } as SaveSnapshot<T>;
        updateSnapshot(nextState);
        notify('saved', nextState);
        return;
      }

      const nextState = {
        ...snapshotRef.current,
        status: 'saving',
        isDirty: true,
        isSaving: true,
        isSaved: false,
        error: null,
        value: checkpoint,
      } as SaveSnapshot<T>;
      updateSnapshot(nextState);
      notify('saving', nextState);

      await Promise.resolve(options.onSave(checkpoint));

      if (!mountedRef.current) return;
      if (checkpointVersion !== versionRef.current) {
        const latestValue = valueRef.current;
        const staleState = {
          ...snapshotRef.current,
          status: 'dirty',
          isDirty: true,
          isSaving: false,
          isSaved: false,
          value: latestValue,
        } as SaveSnapshot<T>;
        updateSnapshot(staleState);
        notify('dirty', staleState);
        if (options.autoSave !== false) {
          const delay = options.debounce ?? 150;
          if (timeoutRef.current != null) {
            globalThis.clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = globalThis.setTimeout(() => {
            if (flushRef.current) {
              void flushRef.current();
            }
          }, delay);
        }
        return;
      }

      const savedAt = Date.now();
      lastSavedRef.current = checkpoint;
      persistLocal(checkpoint);
      const savedState = {
        ...snapshotRef.current,
        value: checkpoint,
        status: 'saved',
        isDirty: false,
        isSaving: false,
        isSaved: true,
        error: null,
        lastSavedAt: savedAt,
        lastSavedValue: checkpoint,
      } as SaveSnapshot<T>;
      updateSnapshot(savedState);
      notify('saved', savedState);

      if (options.onSaved) {
        options.onSaved(checkpoint, savedAt);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      const normalized = error instanceof Error ? error : new Error(String(error));
      const failedState = {
        ...snapshotRef.current,
        status: 'error',
        isDirty: true,
        isSaving: false,
        isSaved: false,
        error: normalized,
      } as SaveSnapshot<T>;
      updateSnapshot(failedState);
      notify('failed', failedState, normalized);
      if (options.onError) {
        options.onError(normalized);
      }
    }
  }, [compare, notify, options.autoSave, options.debounce, options.enabled, options.offlineCheck, options.onError, options.onSave, options.onSaved, persistLocal, updateSnapshot]);

  const flush = useCallback(() => {
    const previous = savePromiseRef.current;
    const current = previous
      ? previous.catch(() => undefined).then(runFlush)
      : runFlush();
    savePromiseRef.current = current;
    const clearCurrent = () => {
      if (savePromiseRef.current === current) {
        savePromiseRef.current = null;
      }
    };
    void current.then(clearCurrent, clearCurrent);
    return current;
  }, [runFlush]);

  flushRef.current = flush;

  const save = useCallback(async () => {
    await flush();
  }, [flush]);

  const retry = useCallback(async () => {
    await flush();
  }, [flush]);

  const reset = useCallback(() => {
    if (timeoutRef.current != null) {
      globalThis.clearTimeout(timeoutRef.current);
    }
    valueRef.current = initialValue;
    lastSavedRef.current = initialValue;
    versionRef.current += 1;
    const local = localConfigRef.current;
    if (local?.enabled) {
      const adapter = local.storage ?? createStorageAdapter(localKey, (next) => local.serialize ? local.serialize(next) : JSON.stringify(next), (raw) => {
        const parser = local.deserialize ?? JSON.parse;
        return parser(raw);
      });
      adapter.removeItem(localKey);
    }
    const resetState = {
      value: initialValue,
      status: 'idle',
      isDirty: false,
      isSaving: false,
      isSaved: true,
      error: null,
      lastSavedAt: null,
      lastSavedValue: initialValue,
      localPersisted: false,
    } as SaveSnapshot<T>;
    updateSnapshot({ ...resetState });
    notify('reset', resetState);
  }, [initialValue, localEnabled, localKey, notify, updateSnapshot]);

  const cancel = useCallback(() => {
    if (timeoutRef.current != null) {
      globalThis.clearTimeout(timeoutRef.current);
    }
  }, []);

  const plugin = useMemo(
    () => ({
      getState: () => snapshot,
      update: (patch: Partial<SaveSnapshot<T>> & { status?: SaveStateStatus; source?: string }) => {
        updateSnapshot((prev) => ({
          ...prev,
          ...patch,
          status: patch.status ?? prev.status,
        }));
      },
      complete: () => {
        const savedAt = Date.now();
        lastSavedRef.current = valueRef.current;
        updateSnapshot({
          status: 'saved',
          isDirty: false,
          isSaving: false,
          isSaved: true,
          lastSavedAt: savedAt,
          lastSavedValue: valueRef.current,
          error: null,
        });
      },
      reportError: (error: unknown) => {
        updateSnapshot({
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
          isDirty: true,
          isSaving: false,
          isSaved: false,
        });
      },
    }),
    [snapshot, updateSnapshot]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => {
      if (snapshot.status === 'offline') {
        void flush();
      }
    };
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, [flush, snapshot.status]);

  const on = useCallback((eventName: keyof typeof listenersRef.current, handler: (snapshot: SaveSnapshot<T>, error?: unknown) => void) => {
    listenersRef.current[eventName].push(handler as (snapshot: SaveSnapshot<T>) => void);
    return () => {
      const list = listenersRef.current[eventName];
      const index = list.indexOf(handler as (snapshot: SaveSnapshot<T>) => void);
      if (index >= 0) {
        list.splice(index, 1);
      }
    };
  }, []);

  const off = useCallback((eventName: keyof typeof listenersRef.current, handler: (snapshot: SaveSnapshot<T>, error?: unknown) => void) => {
    const list = listenersRef.current[eventName];
    const index = list.indexOf(handler as (snapshot: SaveSnapshot<T>) => void);
    if (index >= 0) {
      list.splice(index, 1);
    }
  }, []);

  return {
    value: snapshot.value,
    status: snapshot.status,
    isDirty: snapshot.isDirty,
    isSaving: snapshot.isSaving,
    isSaved: snapshot.isSaved,
    error: snapshot.error,
    lastSavedAt: snapshot.lastSavedAt,
    lastSavedValue: snapshot.lastSavedValue,
    setValue,
    save,
    retry,
    reset,
    cancel,
    flush,
    agent: plugin,
    on,
    off,
  };
}
