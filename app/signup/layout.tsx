import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create your free TheCore account to securely track side projects, hosting logins, and encrypted environment variables.',
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title: 'Sign up | TheCore',
    description: 'Create your free TheCore account to securely track side projects, hosting logins, and encrypted environment variables.',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

