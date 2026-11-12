import { createSaveStateController } from '../src/core/state-machine';

describe('createSaveStateController', () => {
  it('moves to an error state and emits failure when saving rejects', async () => {
    const failure = new Error('Save failed.');
    const onError = vi.fn();
    const onFailed = vi.fn();
    const controller = createSaveStateController({
      initialValue: 'draft',
      onSave: async () => {
        throw failure;
      },
      onError,
    });
    controller.on('failed', onFailed);

    await expect(controller.save()).rejects.toThrow('Save failed.');

    expect(controller.getState()).toMatchObject({
      status: 'error',
      isDirty: true,
      isSaving: false,
      isSaved: false,
      error: failure,
    });
    expect(onError).toHaveBeenCalledWith(failure);
    expect(onFailed).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }), failure);
  });
});
