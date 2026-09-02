import React from 'react';
import { useAppContext } from '../hooks/useAppContext';

export function Home() {
  const { user } = useAppContext();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Super Web</h1>
      <p>Shell application for the Super Web micro frontend ecosystem.</p>
      <p>{user ? `Signed in as ${user.email}` : 'Not signed in.'}</p>
    </div>
  );
}
