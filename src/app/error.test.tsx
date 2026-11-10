import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ErrorBoundary from './error';

describe('error boundary', () => {
  it('shows the message and a library Button that calls reset', () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error('boom')} reset={reset} />);
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
    const button = screen.getByRole('button', { name: 'Try again' });
    expect(button).toHaveClass('btn', 'btn-primary');
    fireEvent.click(button);
    expect(reset).toHaveBeenCalledOnce();
  });
});
