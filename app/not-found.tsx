import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 relative flex items-center justify-center mb-6">
        <div className="absolute top-0 left-0 w-10 h-12 bg-accent-secondary rounded-2xl" />
        <div className="absolute bottom-0 right-0 w-12 h-10 bg-accent-primary rounded-2xl" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-content tracking-tight mb-3">
        404 - Page Not Found
      </h1>
      <p className="text-content-secondary text-base sm:text-lg max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-white font-semibold rounded-[var(--radius-btn)] shadow-[var(--shadow-sm)] hover:opacity-90 transition-opacity"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}

