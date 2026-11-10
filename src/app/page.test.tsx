import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '@/context/AppContext';
import Home from './page';

describe('Home', () => {
  it('renders the shell landing page', () => {
    render(
      <AppProvider>
        <Home />
      </AppProvider>
    );
    expect(screen.getByRole('heading', { name: 'Super Web' })).toBeInTheDocument();
    expect(screen.getByText('Not signed in.')).toBeInTheDocument();
  });
});
