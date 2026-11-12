'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  SaveBadge,
  SaveButton,
  SaveIndicator,
  SaveProgress,
  SaveStatus,
  type SaveStateStatus,
  type SaveStatusLabels,
} from 'savestate';

const states: SaveStateStatus[] = [
  'idle',
  'dirty',
  'saving',
  'saved',
  'error',
  'offline',
  'syncing',
  'conflict',
];

const indicatorVariants = ['default', 'soft', 'ghost', 'outline', 'minimal', 'solid'] as const;
const badgeVariants = ['soft', 'outline', 'solid'] as const;
const buttonVariants = ['primary', 'secondary', 'outline', 'ghost'] as const;
const sizes = ['sm', 'md', 'lg'] as const;
const componentNames: ComponentName[] = ['indicator', 'badge', 'button', 'progress', 'status'];
const colorNames: (keyof StateColors)[] = ['success', 'warning', 'danger', 'offline', 'conflict'];

type ComponentName = 'indicator' | 'badge' | 'button' | 'progress' | 'status';
type IndicatorVariant = (typeof indicatorVariants)[number];
type BadgeVariant = (typeof badgeVariants)[number];
type ButtonVariant = (typeof buttonVariants)[number];
type Size = (typeof sizes)[number];
type StateColors = {
  success: string;
  warning: string;
  danger: string;
  offline: string;
  conflict: string;
};
type ColorVariables = CSSProperties & {
  '--ss-success': string;
  '--ss-warning': string;
  '--ss-danger': string;
  '--ss-offline': string;
  '--ss-conflict': string;
};

const initialColors: StateColors = {
  success: '#16835d',
  warning: '#a45b08',
  danger: '#c33b42',
  offline: '#687180',
  conflict: '#7049be',
};

function isOption<T extends readonly string[]>(value: string, options: T): value is T[number] {
  return options.some((option) => option === value);
}

function isComponentName(value: string): value is ComponentName {
  return componentNames.some((name) => name === value);
}

export function SaveComponentPlayground() {
  const [component, setComponent] = useState<ComponentName>('indicator');
  const [state, setState] = useState<SaveStateStatus>('saved');
  const [variant, setVariant] = useState<{
    indicator: IndicatorVariant;
    badge: BadgeVariant;
    button: ButtonVariant;
  }>({ indicator: 'solid', badge: 'solid', button: 'primary' });
  const [size, setSize] = useState<Size>('md');
  const [stateLabel, setStateLabel] = useState('Saved');
  const [progressLabel, setProgressLabel] = useState('Uploading document');
  const [retryLabel, setRetryLabel] = useState('Try again');
  const [errorMessage, setErrorMessage] = useState('The server could not be reached.');
  const [progress, setProgress] = useState(42);
  const [indeterminate, setIndeterminate] = useState(false);
  const [showIcon, setShowIcon] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [retryEnabled, setRetryEnabled] = useState(true);
  const [expandable, setExpandable] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const [colors, setColors] = useState(initialColors);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  useEffect(
    () => {
      setLastSavedAt(Date.now());
      return () => {
        if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      };
    },
    [],
  );

  const runSave = () => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    const shouldFail = failNext;
    setFailNext(false);
    setState('saving');
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      if (shouldFail) {
        setState('error');
      } else {
        setState('saved');
        setLastSavedAt(Date.now());
      }
    }, 650);
  };

  const chooseState = (nextState: SaveStateStatus) => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setState(nextState);
    setStateLabel(nextState === 'saved' ? 'Saved' : nextState === 'error' ? 'Could not save' : nextState);
  };

  const currentVariants =
    component === 'indicator'
      ? indicatorVariants
      : component === 'badge'
        ? badgeVariants
        : component === 'button'
          ? buttonVariants
          : null;
  const currentVariant =
    component === 'indicator'
      ? variant.indicator
      : component === 'badge'
        ? variant.badge
        : component === 'button'
          ? variant.button
          : null;
  const labels: Partial<SaveStatusLabels> = { [state]: stateLabel };
  const colorStyle: ColorVariables = {
    '--ss-success': colors.success,
    '--ss-warning': colors.warning,
    '--ss-danger': colors.danger,
    '--ss-offline': colors.offline,
    '--ss-conflict': colors.conflict,
  };

  const updateVariant = (value: string) => {
    if (component === 'indicator' && isOption(value, indicatorVariants)) {
      setVariant((previous) => ({ ...previous, indicator: value }));
    } else if (component === 'badge' && isOption(value, badgeVariants)) {
      setVariant((previous) => ({ ...previous, badge: value }));
    } else if (component === 'button' && isOption(value, buttonVariants)) {
      setVariant((previous) => ({ ...previous, button: value }));
    }
  };

  let preview: ReactNode = null;
  let code = '';
  const colorCode = `style={{\n  "--ss-success": "${colors.success}",\n  "--ss-warning": "${colors.warning}",\n  "--ss-danger": "${colors.danger}",\n  "--ss-offline": "${colors.offline}",\n  "--ss-conflict": "${colors.conflict}",\n} as React.CSSProperties}`;

  switch (component) {
    case 'indicator':
      preview = (
        <SaveIndicator
          state={state}
          labels={labels}
          size={size}
          variant={variant.indicator}
          showIcon={showIcon}
          showTimestamp={showTimestamp}
          lastSavedAt={lastSavedAt}
          error={state === 'error' ? errorMessage : null}
          style={colorStyle}
        />
      );
      code = `<SaveIndicator\n  state="${state}"\n  variant="${variant.indicator}"\n  size="${size}"\n  showIcon={${showIcon}}\n  showTimestamp={${showTimestamp}}\n  lastSavedAt={lastSavedAt}\n  error={${state === 'error' ? JSON.stringify(errorMessage) : 'save.error'}}\n  labels={{ ${state}: ${JSON.stringify(stateLabel)} }}\n  ${colorCode}\n/>`;
      break;
    case 'badge':
      preview = <SaveBadge state={state} labels={labels} size={size} variant={variant.badge} style={colorStyle} />;
      code = `<SaveBadge\n  state="${state}"\n  variant="${variant.badge}"\n  size="${size}"\n  labels={{ ${state}: ${JSON.stringify(stateLabel)} }}\n  ${colorCode}\n/>`;
      break;
    case 'button':
      preview = (
        <SaveButton
          state={state}
          labels={{ ...labels, retry: retryLabel || 'Try again' }}
          size={size}
          variant={variant.button}
          retryable={retryEnabled}
          onSave={runSave}
          onRetry={runSave}
          style={colorStyle}
        />
      );
      code = `<SaveButton\n  state="${state}"\n  variant="${variant.button}"\n  size="${size}"\n  labels={{ ${state}: ${JSON.stringify(stateLabel)}, retry: ${JSON.stringify(retryLabel || 'Try again')} }}\n  onSave={save}\n  onRetry={retry}\n  retryable={${retryEnabled}}\n  ${colorCode}\n/>`;
      break;
    case 'progress':
      preview = (
        <div className="component-playground__progress">
          <SaveProgress
            state={state}
            progress={indeterminate ? null : progress}
            label={progressLabel || 'Uploading document'}
            style={colorStyle}
          />
        </div>
      );
      code = `<SaveProgress\n  state="${state}"\n  progress={${indeterminate ? 'null' : progress}}\n  label=${JSON.stringify(progressLabel || 'Uploading document')}\n  ${colorCode}\n/>`;
      break;
    case 'status':
      preview = (
        <SaveStatus
          state={state}
          lastSavedAt={lastSavedAt}
          error={state === 'error' ? errorMessage : null}
          onRetry={retryEnabled ? runSave : undefined}
          retryLabel={retryLabel || 'Try again'}
          expandable={expandable}
          style={colorStyle}
        />
      );
      code = `<SaveStatus\n  state="${state}"\n  error={${state === 'error' ? JSON.stringify(errorMessage) : 'save.error'}}\n  lastSavedAt={lastSavedAt}\n  onRetry={${retryEnabled ? 'retry' : 'undefined'}}\n  retryLabel=${JSON.stringify(retryLabel || 'Try again')}\n  expandable={${expandable}}\n  ${colorCode}\n/>`;
      break;
  }

  return (
    <section className="component-playground" aria-label="Interactive component playground">
      <div className="component-playground__controls">
        <label className="component-playground__field">
          <span>Component</span>
          <select
            value={component}
            onChange={(event) => {
              const nextComponent = event.target.value;
              if (isComponentName(nextComponent)) setComponent(nextComponent);
            }}
          >
            <option value="indicator">SaveIndicator</option>
            <option value="badge">SaveBadge</option>
            <option value="button">SaveButton</option>
            <option value="progress">SaveProgress</option>
            <option value="status">SaveStatus</option>
          </select>
        </label>

        <fieldset className="component-playground__group">
          <legend>State</legend>
          <div className="component-playground__options">
            {states.map((item) => (
              <button
                type="button"
                className="component-playground__option"
                aria-pressed={state === item}
                key={item}
                onClick={() => chooseState(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>

        {currentVariants && (
          <fieldset className="component-playground__group">
            <legend>Variant</legend>
            <div className="component-playground__options">
              {currentVariants.map((item) => (
                <button
                  type="button"
                  className="component-playground__option"
                  aria-pressed={currentVariant === item}
                  key={item}
                  onClick={() => updateVariant(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {component !== 'progress' && (
          <fieldset className="component-playground__group">
            <legend>Size</legend>
            <div className="component-playground__options">
              {sizes.map((item) => (
                <button
                  type="button"
                  className="component-playground__option"
                  aria-pressed={size === item}
                  key={item}
                  onClick={() => setSize(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <label className="component-playground__field">
          <span>{component === 'progress' ? 'Progress label' : component === 'status' ? 'Retry button label' : 'Current state label'}</span>
          <input
            value={component === 'progress' ? progressLabel : component === 'status' ? retryLabel : stateLabel}
            onChange={(event) =>
              component === 'progress'
                ? setProgressLabel(event.target.value)
                : component === 'status'
                  ? setRetryLabel(event.target.value)
                  : setStateLabel(event.target.value)
            }
          />
        </label>

        {component === 'button' && (
          <label className="component-playground__field">
            <span>Retry button label</span>
            <input value={retryLabel} onChange={(event) => setRetryLabel(event.target.value)} />
          </label>
        )}

        {component === 'progress' && (
          <>
            <label className="component-playground__field">
              <span>Progress: {indeterminate ? 'Indeterminate' : `${progress}%`}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                disabled={indeterminate}
                onChange={(event) => setProgress(Number(event.target.value))}
              />
            </label>
            <label className="component-playground__check">
              <input
                type="checkbox"
                checked={indeterminate}
                onChange={(event) => setIndeterminate(event.target.checked)}
              />
              Indeterminate progress
            </label>
          </>
        )}

        {component === 'indicator' && (
          <div className="component-playground__options">
            <label className="component-playground__check">
              <input type="checkbox" checked={showIcon} onChange={(event) => setShowIcon(event.target.checked)} />
              Show icon
            </label>
            <label className="component-playground__check">
              <input
                type="checkbox"
                checked={showTimestamp}
                onChange={(event) => setShowTimestamp(event.target.checked)}
              />
              Show timestamp
            </label>
          </div>
        )}

        {(component === 'button' || component === 'status') && (
          <label className="component-playground__check">
            <input
              type="checkbox"
              checked={retryEnabled}
              onChange={(event) => setRetryEnabled(event.target.checked)}
            />
            Enable retry
          </label>
        )}

        {component === 'status' && (
          <>
            <label className="component-playground__field">
              <span>Error message</span>
              <input value={errorMessage} onChange={(event) => setErrorMessage(event.target.value)} />
            </label>
            <label className="component-playground__check">
              <input type="checkbox" checked={expandable} onChange={(event) => setExpandable(event.target.checked)} />
              Expandable details
            </label>
          </>
        )}

        <label className="component-playground__check">
          <input type="checkbox" checked={failNext} onChange={(event) => setFailNext(event.target.checked)} />
          Fail the next save
        </label>

        <details className="component-playground__colors">
          <summary>Customize state colors</summary>
          <div className="component-playground__color-grid">
            {colorNames.map((name) => (
              <label key={name}>
                <span>{name}</span>
                <input
                  type="color"
                  value={colors[name]}
                  aria-label={`${name} state color`}
                  onChange={(event) => setColors((previous) => ({ ...previous, [name]: event.target.value }))}
                />
              </label>
            ))}
          </div>
        </details>
      </div>

      <div className="component-playground__output">
        <div className="component-playground__preview" style={colorStyle}>
          {preview}
        </div>
        <pre className="component-playground__code"><code>{code}</code></pre>
      </div>
    </section>
  );
}
