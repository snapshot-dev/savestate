import { fireEvent, render, screen } from '@testing-library/react';
import { SaveBadge, SaveStatus } from '../src/components/SaveIndicator';

describe('save-state components', () => {
  it('shows a check and an error mark in solid badges', () => {
    render(
      <>
        <SaveBadge state="saved" variant="solid" />
        <SaveBadge state="error" variant="solid" />
      </>,
    );

    expect(screen.getByRole('status', { name: 'Saved' }).className).toContain('save-badge--solid');
    expect(screen.getByText('✓')).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Could not save' }).className).toContain('save-badge--solid');
    expect(screen.getByText('×')).toBeTruthy();
  });

  it('renders an error message only once in SaveStatus', () => {
    render(<SaveStatus state="error" error="The server could not be reached." />);

    expect(screen.getAllByText('The server could not be reached.')).toHaveLength(1);
  });

  it('renders the retry action as an accessible icon button beside the status', () => {
    const onRetry = vi.fn();
    const { container } = render(
      <SaveStatus state="error" error="The server could not be reached." onRetry={onRetry} />,
    );
    const status = container.querySelector('.save-status');
    const retry = screen.getByRole('button', { name: 'Try again' });

    expect(retry.querySelector('svg')).toBeTruthy();
    expect(status?.lastElementChild).toBe(retry);
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
