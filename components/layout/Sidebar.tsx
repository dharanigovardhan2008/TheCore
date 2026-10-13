"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Brand from "@/components/ui/Brand";
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  KeyRound, 
  Users, 
  Settings,
  LogOut
} from "lucide-react";
import clsx from "clsx";
import { signOut } from "@/app/dashboard/settings/actions";

export interface UserProfileInfo {
  email: string;
  name: string;
  plan?: string;
  isPro?: boolean;
  planExpiresAt?: string | null;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { label: "To-dos", href: "/dashboard/todos", icon: CheckSquare },
  { label: "Secrets", href: "/dashboard/env", icon: KeyRound },
  { label: "Accounts", href: "/dashboard/accounts", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ user }: { user?: UserProfileInfo }) {
  const pathname = usePathname();
  const isPro = Boolean(user?.isPro);

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-[calc(100vh-32px)] m-4 rounded-[var(--radius-panel)] glass shadow-[var(--shadow-soft)] overflow-hidden">
      {/* Brand Header */}
      <div className="flex items-center px-6 py-6 pb-4">
        <Brand size="lg" href="/dashboard" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-full transition-premium font-medium text-sm",
                isActive 
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold" 
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-tint)] hover:text-[var(--text-primary)]"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: Plan Type & User & Logout */}
      <div className="p-3 mt-auto border-t border-[var(--border-light)] space-y-2.5 bg-white/40 dark:bg-black/20">
        {/* Plan Type in Sidebar */}
        <div className="p-3 rounded-2xl bg-[var(--bg-surface-tint)] border border-[var(--border-light)] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Plan Type</span>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                isPro
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                  : "bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/40"
              )}
            >
              {isPro ? "PRO" : "FREE"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-[11px] text-[var(--text-tertiary)] font-medium truncate max-w-[120px]">
              {isPro ? "Unlimited Projects" : "3 Projects Limit"}
            </span>
            {isPro ? (
              <Link
                href="/dashboard/settings/billing"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
              >
                Billing
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-xs uppercase shrink-0 shadow-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold truncate text-[var(--text-primary)]">{user?.name || 'User'}</span>
            </div>
            <span className="text-xs text-[var(--text-tertiary)] truncate">{user?.email || 'user@example.com'}</span>
          </div>
        </div>

        {/* Logout Button */}
        <form action={signOut} className="w-full pt-0.5">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-slate-200/70 hover:border-rose-200 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Log out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
