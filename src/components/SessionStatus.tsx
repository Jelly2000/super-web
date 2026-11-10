'use client';

import { useAppContext } from '@/hooks/useAppContext';

export function SessionStatus() {
  const { user } = useAppContext();
  return <p>{user ? `Signed in as ${user.email}` : 'Not signed in.'}</p>;
}
