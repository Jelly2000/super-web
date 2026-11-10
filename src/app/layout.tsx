import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppProvider } from '@/context/AppContext';
import { Nav } from '@/components/Nav';
import '@jelly2000/component-ui-library/styles';
import './globals.css';

export const metadata: Metadata = {
  title: 'Super Web',
  description: 'Shell application for the Super Web ecosystem',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Nav />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
