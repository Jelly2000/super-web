'use client';

import { Button } from '@jelly2000/component-ui-library';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" style={{ padding: '2rem' }}>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <Button variant="primary" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
