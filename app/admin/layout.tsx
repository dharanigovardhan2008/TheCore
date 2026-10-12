import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileSpreadsheet,
  ShieldAlert,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Console | TheCore',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const adminDb = createAdminClient();
  const { data: profile } = await adminDb
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    notFound();
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Plans & Config', href: '/admin/plans', icon: FileSpreadsheet },
    { label: 'Audit Log', href: '/admin/audit', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-content)] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-[var(--separator)] bg-[var(--bg-surface)] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Admin Header */}
          <div className="p-6 border-b border-[var(--separator)] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight">TheCore</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-[var(--text-content-secondary)] mt-1 truncate">
                {profile.display_name || user.email}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[var(--text-content-secondary)] hover:text-[var(--text-content)] hover:bg-[var(--bg-grouped)] transition-colors"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer in Sidebar */}
        <div className="p-4 border-t border-[var(--separator)] space-y-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-grouped)] text-[11px] text-[var(--text-content-secondary)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Vault encryption protected</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text-content-secondary)] hover:text-[var(--text-content)] hover:bg-[var(--bg-grouped)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 max-w-6xl overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

