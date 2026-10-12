import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Sign in to your TheCore vault to track developer side projects, hosting accounts, and client-side encrypted .env files.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Log in | TheCore',
    description: 'Sign in to your TheCore vault to track developer side projects, hosting accounts, and client-side encrypted .env files.',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

