import React from 'react';
import { CenteredLoader } from '@/components/ui/LoadingOrb';

export default function ProfileLoading() {
  return (
    <div className="min-h-[75vh] w-full flex items-center justify-center animate-in fade-in duration-200">
      <CenteredLoader
        minHeight="min-h-[50vh]"
        size={64}
        state="listening"
        withContainer={true}
      />
    </div>
  );
}

