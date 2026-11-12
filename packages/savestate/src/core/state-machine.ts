import type {
  SaveConflict,
  SaveEventName,
  SaveEvents,
  SaveSnapshot,
  SaveStateController,
  SaveStateOptions,
  SaveStateStatus,
} from '../types/save-state';

const SAVE_STATE_TRANSITIONS: Record<SaveStateStatus, SaveStateStatus[]> = {
  idle: ['dirty', 'saving', 'saved', 'error', 'offline', 'syncing', 'conflict'],
  dirty: ['saving', 'saved', 'error', 'offline', 'syncing', 'conflict', 'idle'],
  saving: ['saved', 'error', 'offline', 'syncing', 'conflict', 'dirty'],
  saved: ['dirty', 'saving', 'idle', 'offline', 'syncing'],
  error: ['dirty', 'saving', 'saved', 'offline', 'syncing', 'conflict', 'idle'],
  offline: ['dirty', 'saving', 'saved', 'error', 'syncing', 'conflict', 'idle'],
  syncing: ['saved', 'error', 'offline', 'dirty', 'conflict', 'idle'],
  conflict: ['dirty', 'saving', 'saved', 'error', 'offline', 'syncing', 'idle'],
};

export const isValidTransition = (from: SaveStateStatus, to: SaveStateStatus) =>
  SAVE_STATE_TRANSITIONS[from]?.includes(to) ?? false;

export const createSaveStateController = <T>(
  options: SaveStateOptions<T>
): SaveStateController<T> => {
  const listeners = {
    idle: [] as Array<SaveEvents<T>['idle']>,
    dirty: [] as Array<SaveEvents<T>['dirty']>,
    saving: [] as Array<SaveEvents<T>['saving']>,
    saved: [] as Array<SaveEvents<T>['saved']>,
    failed: [] as Array<SaveEvents<T>['failed']>,
    offline: [] as Array<SaveEvents<T>['offline']>,
    syncing: [] as Array<SaveEvents<T>['syncing']>,
    conflict: [] as Array<SaveEvents<T>['conflict']>,
    reset: [] as Array<SaveEvents<T>['reset']>,
  } as const;

  let snapshot: SaveSnapshot<T> = {
    value: options.initialValue,
    status: 'idle',
    isDirty: false,
    isSaving: false,
    isSaved: true,
    error: null,
    lastSavedAt: null,
    lastSavedValue: options.initialValue,
    localPersisted: false,
  };

  const emit = <K extends SaveEventName>(eventName: K, payload: SaveSnapshot<T>, extra?: unknown) => {
    const handlers = listeners[eventName as keyof typeof listeners] as Array<(...args: any[]) => void>;
    handlers.forEach((handler) => {
      if (eventName === 'failed') {
        (handler as SaveEvents<T>['failed'])(payload, extra as unknown);
      } else if (eventName === 'conflict') {
        (handler as SaveEvents<T>['conflict'])(payload, extra as SaveConflict<T>);
      } else {
        (handler as (snapshot: SaveSnapshot<T>) => void)(payload);
      }
    });
  };

  const updateSnapshot = (next: Partial<SaveSnapshot<T>>) => {
    const updated = { ...snapshot, ...next };
    snapshot = updated;
    return updated;
  };

  const setStatus = (nextStatus: SaveStateStatus, patch: Partial<SaveSnapshot<T>> = {}) => {
    if (!isValidTransition(snapshot.status, nextStatus) && !(snapshot.status === 'idle' && nextStatus === 'idle')) {
      return snapshot;
    }

    const next = updateSnapshot({
      status: nextStatus,
      isDirty: ['dirty', 'saving', 'error', 'offline', 'conflict'].includes(nextStatus),
      isSaving: nextStatus === 'saving' || nextStatus === 'syncing',
      isSaved: nextStatus === 'saved',
      ...patch,
    });

    switch (nextStatus) {
      case 'idle':
        emit('idle', next);
        break;
      case 'dirty':
        emit('dirty', next);
        break;
      case 'saving':
        emit('saving', next);
        break;
      case 'saved':
        emit('saved', next);
        break;
      case 'error':
        emit('failed', next, next.error ?? new Error('Save failed'));
        break;
      case 'offline':
        emit('offline', next);
        break;
      case 'syncing':
        emit('syncing', next);
        break;
      case 'conflict':
        emit('conflict', next, (patch as { conflict?: SaveConflict<T> }).conflict ?? {
          localValue: next.value,
          remoteValue: next.value,
          message: 'Conflict detected.',
          resolved: false,
        });
        break;
      default:
        break;
    }

    return next;
  };

  const setValue = (value: T) => {
    const sameAsSaved = options.compare ? options.compare(snapshot.lastSavedValue ?? options.initialValue, value) : snapshot.lastSavedValue === value;
    const next = updateSnapshot({
      value,
      status: sameAsSaved ? 'saved' : 'dirty',
      isDirty: !sameAsSaved,
      isSaving: false,
      isSaved: sameAsSaved,
      error: null,
      localPersisted: false,
    });

    if (!sameAsSaved) {
      emit('dirty', next);
      if (options.onDirty) {
        options.onDirty(value);
      }
    }

    return next;
  };

  const reset = () => {
    const next = updateSnapshot({
      value: options.initialValue,
      status: 'idle',
      isDirty: false,
      isSaving: false,
      isSaved: true,
      error: null,
      lastSavedAt: null,
      lastSavedValue: options.initialValue,
      localPersisted: false,
    });
    emit('reset', next);
    emit('idle', next);
    return next;
  };

  const saveCurrentValue = async () => {
    const next = setStatus('saving');
    let savedAt: number;
    try {
      await options.onSave(next.value);
      savedAt = Date.now();
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error));
      setStatus('error', {
        error: normalized,
        isDirty: true,
        isSaving: false,
        isSaved: false,
      });
      options.onError?.(normalized);
      throw normalized;
    }

    setStatus('saved', {
      lastSavedAt: savedAt,
      lastSavedValue: next.value,
      error: null,
    });
    options.onSaved?.(next.value, savedAt);
  };

  const controller: SaveStateController<T> = {
    getState: () => ({ ...snapshot }),
    setValue,
    save: saveCurrentValue,
    retry: saveCurrentValue,
    reset,
    cancel: () => {
      setStatus('idle');
    },
    flush: async () => {
      await controller.save();
    },
    on: (eventName, handler) => {
      const list = listeners[eventName as keyof typeof listeners] as Array<typeof handler>;
      list.push(handler);
      return () => controller.off(eventName, handler);
    },
    off: (eventName, handler) => {
      const list = listeners[eventName as keyof typeof listeners] as Array<typeof handler>;
      const index = list.indexOf(handler);
      if (index >= 0) {
        list.splice(index, 1);
      }
    },
    agent: {
      getState: () => ({ ...snapshot }),
      update: (update) => {
        const next = updateSnapshot({
          ...snapshot,
          ...update,
          status: update.status ?? snapshot.status,
        });
        if (update.status) {
          setStatus(update.status, next);
        }
      },
      complete: () => {
        setStatus('saved', {
          lastSavedAt: Date.now(),
          lastSavedValue: snapshot.value,
          error: null,
        });
      },
      reportError: (error) => {
        const next = updateSnapshot({
          error: error instanceof Error ? error : new Error(String(error)),
          status: 'error',
          isDirty: true,
          isSaving: false,
          isSaved: false,
        });
        emit('failed', next, error);
      },
    },
  };

  return controller;
};

export const SAVE_STATE_MACHINE = { transitions: SAVE_STATE_TRANSITIONS };
