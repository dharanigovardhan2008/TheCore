import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-content mb-2">Project not found</h2>
      <p className="text-content-secondary mb-8">
        The project you are looking for does not exist, or you do not have permission to view it.
      </p>
      <Link 
        href="/dashboard"
        className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white font-medium rounded-[var(--radius-btn)] hover:opacity-90 transition-opacity"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>
    </div>
  );
}

