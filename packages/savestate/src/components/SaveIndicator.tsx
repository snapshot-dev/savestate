import type {
  SaveBadgeProps,
  SaveButtonProps,
  SaveIndicatorProps,
  SaveProgressProps,
  SaveStateStatus,
  SaveStatusProps,
  SaveStatusLabels,
} from '../types/save-state';

const DEFAULT_LABELS: SaveStatusLabels = {
  idle: 'Ready to save',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Could not save',
  offline: 'Offline',
  syncing: 'Syncing…',
  conflict: 'Conflict needs review',
};

const getLabel = (state: SaveStateStatus, labels?: Partial<SaveStatusLabels>) =>
  labels?.[state] ?? DEFAULT_LABELS[state];

const formatTime = (value?: number | null) => {
  if (!value) return 'Not saved yet';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(value);
};

function StateIcon({ state }: { state: SaveStateStatus }) {
  if (state === 'saving' || state === 'syncing') {
    return <span className="save-state__spinner" aria-hidden="true" />;
  }
  if (state === 'saved') return <span className="save-state__check" aria-hidden="true">✓</span>;
  if (state === 'error') return <span className="save-state__symbol" aria-hidden="true">×</span>;
  if (state === 'conflict') return <span className="save-state__symbol" aria-hidden="true">↔</span>;
  if (state === 'offline') return <span className="save-state__symbol" aria-hidden="true">⌁</span>;
  return <span className="save-state__dot" aria-hidden="true" />;
}

export function SaveIndicator({
  state,
  lastSavedAt,
  error,
  labels,
  size = 'sm',
  variant = 'default',
  showIcon = true,
  showTimestamp = true,
  className,
  style,
}: SaveIndicatorProps) {
  const message = typeof error === 'string' ? error : error?.message;

  return (
    <span
      className={['save-state', `save-state--${size}`, `save-state--${variant}`, `save-state--${state}`, className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      role={state === 'error' ? 'alert' : 'status'}
      aria-live={state === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {showIcon && <span className="save-state__icon"><StateIcon state={state} /></span>}
      <span className="save-state__text">{getLabel(state, labels)}</span>
      {showTimestamp && state === 'saved' && lastSavedAt != null && (
        <time className="save-state__timestamp" dateTime={new Date(lastSavedAt).toISOString()}>
          {formatTime(lastSavedAt)}
        </time>
      )}
      {message && <span className="save-state__error">{message}</span>}
    </span>
  );
}

export function SaveBadge({ state, labels, size = 'sm', variant = 'soft', className, style }: SaveBadgeProps) {
  return (
    <span
      className={['save-badge', `save-badge--${state}`, `save-badge--${size}`, `save-badge--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      role="status"
      aria-label={getLabel(state, labels)}
    >
      <span className="save-badge__icon" aria-hidden="true"><StateIcon state={state} /></span>
      {getLabel(state, labels)}
    </span>
  );
}

export function SaveProgress({ state, progress, label, className, style }: SaveProgressProps) {
  const indeterminate = progress == null && (state === 'saving' || state === 'syncing');
  const value = state === 'saved' ? 100 : Math.min(100, Math.max(0, progress ?? 0));

  return (
    <div className={['save-progress', `save-progress--${state}`, className].filter(Boolean).join(' ')} style={style}>
      {label && <div className="save-progress__label">{label}</div>}
      <div
        className="save-progress__track"
        role="progressbar"
        aria-label={label ?? getLabel(state)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : value}
      >
        <span
          className={['save-progress__bar', indeterminate && 'save-progress__bar--indeterminate'].filter(Boolean).join(' ')}
          style={{ width: indeterminate ? undefined : `${value}%` }}
        />
      </div>
    </div>
  );
}

export function SaveButton({
  state,
  onSave,
  onRetry,
  disabled,
  retryable,
  variant = 'primary',
  size = 'md',
  labels,
  className,
  style,
}: SaveButtonProps) {
  const busy = state === 'saving' || state === 'syncing';
  const canRetry = state === 'error' && retryable && onRetry;
  const blocked = disabled || busy || state === 'conflict';
  const action = canRetry ? onRetry : onSave;

  return (
    <button
      type="button"
      className={['save-button', `save-button--${variant}`, `save-button--${size}`, className].filter(Boolean).join(' ')}
      style={style}
      disabled={blocked}
      onClick={blocked || !action ? undefined : () => void action()}
    >
      {busy ? <span className="save-button__spinner" aria-hidden="true" /> : <StateIcon state={state} />}
      <span>{busy ? labels?.saving ?? DEFAULT_LABELS.saving : canRetry ? labels?.retry ?? 'Try again' : labels?.save ?? 'Save changes'}</span>
    </button>
  );
}

export function SaveStatus({
  state,
  lastSavedAt,
  error,
  onRetry,
  retryLabel = 'Try again',
  expandable = false,
  className,
  style,
}: SaveStatusProps) {
  const content = (
    <div className="save-status">
      <div className="save-status__main">
        <SaveIndicator state={state} lastSavedAt={lastSavedAt} error={error} size="md" />
        {state === 'saved' && lastSavedAt != null && (
          <div className="save-status__timestamp">Last saved {formatTime(lastSavedAt)}</div>
        )}
      </div>
      {onRetry && state === 'error' && (
        <button
          type="button"
          className="save-status__retry"
          aria-label={retryLabel}
          title={retryLabel}
          onClick={() => void onRetry()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 2v6h6" />
            <path d="M3 13a9 9 0 1 0 2.64-6.36L3 8" />
          </svg>
        </button>
      )}
    </div>
  );

  if (!expandable) {
    return <div className={['save-status__wrapper', className].filter(Boolean).join(' ')} style={style}>{content}</div>;
  }

  return (
    <details className={['save-status__wrapper', 'save-status--expandable', className].filter(Boolean).join(' ')} style={style}>
      <summary>Save details</summary>
      {content}
    </details>
  );
}

