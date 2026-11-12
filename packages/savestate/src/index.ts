import metadata from './ai/metadata.json';

export * from './types/save-state';
export * from './core/state-machine';
export { useSaveState } from './react/useSaveState';
export {
  SaveBadge,
  SaveButton,
  SaveIndicator,
  SaveProgress,
  SaveStatus,
} from './components/SaveIndicator';

export const saveStateMetadata = metadata as typeof metadata;

export const saveStateAgent = {
  getState: () => ({ status: 'idle', value: undefined }),
  update: () => undefined,
  complete: () => undefined,
  reportError: () => undefined,
};

export const schema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['idle', 'dirty', 'saving', 'saved', 'error', 'offline', 'syncing', 'conflict'] },
    value: { type: ['string', 'number', 'boolean', 'object', 'array', 'null'] },
  },
};
