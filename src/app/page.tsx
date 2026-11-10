import Link from 'next/link';
import { SessionStatus } from '@/components/SessionStatus';

export default function Home() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Super Web</h1>
      <p>Shell application for the Super Web ecosystem, running on Next.js.</p>
      <SessionStatus />
      <Link href="/portfolio" className="btn btn-primary">
        View portfolio
      </Link>
    </div>
  );
}
