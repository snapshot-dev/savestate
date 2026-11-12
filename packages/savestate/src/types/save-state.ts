export type SaveStateStatus =
  | 'idle'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'error'
  | 'offline'
  | 'syncing'
  | 'conflict';

export type SaveEventName =
  | 'idle'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'failed'
  | 'offline'
  | 'syncing'
  | 'conflict'
  | 'reset';

export interface SaveConflict<T> {
  localValue: T;
  remoteValue: T;
  message: string;
  resolved: boolean;
}

export interface SaveStatusLabels {
  idle: string;
  dirty: string;
  saving: string;
  saved: string;
  error: string;
  offline: string;
  syncing: string;
  conflict: string;
}

export interface StorageAdapter<T> {
  getItem: (key: string) => T | null;
  setItem: (key: string, value: T) => void;
  removeItem: (key: string) => void;
}

export interface LocalPersistenceConfig<T> {
  enabled?: boolean;
  key?: string;
  storage?: StorageAdapter<T>;
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
  onRead?: (value: T | null) => T | null;
  onWrite?: (value: T) => T;
}

export interface RetryConfig {
  enabled?: boolean;
  maxAttempts?: number;
  delayMs?: number;
}

export interface SaveEvents<T> {
  idle: (snapshot: SaveSnapshot<T>) => void;
  dirty: (snapshot: SaveSnapshot<T>) => void;
  saving: (snapshot: SaveSnapshot<T>) => void;
  saved: (snapshot: SaveSnapshot<T>) => void;
  failed: (snapshot: SaveSnapshot<T>, error: unknown) => void;
  offline: (snapshot: SaveSnapshot<T>) => void;
  syncing: (snapshot: SaveSnapshot<T>) => void;
  conflict: (snapshot: SaveSnapshot<T>, conflict: SaveConflict<T>) => void;
  reset: (snapshot: SaveSnapshot<T>) => void;
}

export interface SaveSnapshot<T> {
  value: T;
  status: SaveStateStatus;
  isDirty: boolean;
  isSaving: boolean;
  isSaved: boolean;
  error: Error | null;
  lastSavedAt: number | null;
  lastSavedValue: T | null;
  localPersisted: boolean;
}

export interface SaveStateOptions<T> {
  initialValue: T;
  debounce?: number;
  onSave: (value: T) => Promise<void> | void;
  enabled?: boolean;
  autoSave?: boolean;
  retry?: RetryConfig;
  local?: LocalPersistenceConfig<T>;
  compare?: (previous: T, next: T) => boolean;
  onError?: (error: unknown) => void;
  onSaved?: (value: T, savedAt: number) => void;
  onDirty?: (value: T) => void;
  onConflict?: (conflict: SaveConflict<T>) => void;
  offlineCheck?: () => boolean | Promise<boolean>;
  storageKey?: string;
}

export interface SaveStateController<T> {
  getState: () => SaveSnapshot<T>;
  setValue: (value: T) => void;
  save: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  cancel: () => void;
  flush: () => Promise<void>;
  on: <K extends SaveEventName>(eventName: K, handler: SaveEvents<T>[K]) => () => void;
  off: <K extends SaveEventName>(eventName: K, handler: SaveEvents<T>[K]) => void;
  agent: {
    getState: () => SaveSnapshot<T>;
    update: (update: Partial<SaveSnapshot<T>> & { status?: SaveStateStatus; source?: string }) => void;
    complete: () => void;
    reportError: (error: unknown) => void;
  };
}

export interface SaveIndicatorProps {
  state: SaveStateStatus;
  lastSavedAt?: number | null;
  error?: Error | string | null;
  labels?: Partial<SaveStatusLabels>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'soft' | 'ghost' | 'outline' | 'minimal' | 'solid';
  showIcon?: boolean;
  showTimestamp?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface SaveBadgeProps {
  state: SaveStateStatus;
  labels?: Partial<SaveStatusLabels>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'soft' | 'outline' | 'solid';
  className?: string;
  style?: React.CSSProperties;
}

export interface SaveProgressProps {
  state: SaveStateStatus;
  progress?: number | null;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface SaveButtonProps {
  state: SaveStateStatus;
  onSave?: () => void | Promise<void>;
  onRetry?: () => void | Promise<void>;
  disabled?: boolean;
  retryable?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  labels?: Partial<SaveStatusLabels> & {
    save?: string;
    retry?: string;
    saving?: string;
  };
  className?: string;
  style?: React.CSSProperties;
}

export interface SaveStatusProps {
  state: SaveStateStatus;
  lastSavedAt?: number | null;
  error?: Error | string | null;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  expandable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface SaveRendererProps<T> {
  value: T;
  onChange: (value: T) => void;
  saveState: SaveSnapshot<T>;
  onSave: () => Promise<void>;
}
