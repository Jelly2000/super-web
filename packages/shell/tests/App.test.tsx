import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../src/App';

describe('App', () => {
  it('renders the home page by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Super Web' })).toBeInTheDocument();
    expect(screen.getByText('Not signed in.')).toBeInTheDocument();
  });

  it('navigates to the profile route and shows the unavailable fallback', async () => {
    render(<App />);
    screen.getByRole('button', { name: 'Profile' }).click();
    expect(await screen.findByText('Profile is not available')).toBeInTheDocument();
  });
});
