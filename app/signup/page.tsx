import { Suspense } from 'react';
import SignupClient from './SignupClient';
import LoadingOrb from '@/components/ui/LoadingOrb';

export default function SignupPage() {
  return (
    <div className="gradient-bg">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center w-full">
            <LoadingOrb state="listening" size={64} />
          </div>
        }
      >
        <SignupClient />
      </Suspense>
    </div>
  );
}

