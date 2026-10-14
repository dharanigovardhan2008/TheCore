import { Suspense } from 'react';
import type { Metadata } from 'next';
import SignupClient from './SignupClient';
import LoadingOrb from '@/components/ui/LoadingOrb';

export const metadata: Metadata = {
  title: 'Sign Up | TheCore',
  description: 'Create your account on TheCore to organize and track your side projects, hosting platforms, and .env files.',
};

export default function SignupPage() {
  return (
    <div className="min-h-[100dvh] w-full authenticated-shell flex items-center justify-center p-4 sm:p-6 md:p-8">
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center w-full">
            <LoadingOrb state="listening" size={64} />
          </div>
        }
      >
        <SignupClient />
      </Suspense>
    </div>
  );
}
