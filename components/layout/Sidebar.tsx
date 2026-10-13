"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  KeyRound,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import clsx from "clsx";

import Brand from "@/components/ui/Brand";
import { signOut } from "@/app/dashboard/settings/actions";

export interface UserProfileInfo {
  email: string;
  name: string;
  avatarUrl?: string | null;
  profession?: string | null;
  workplace?: string | null;
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

export default function Sidebar({
  user,
}: {
  user?: UserProfileInfo;
}) {
  const pathname = usePathname();
  const isPro = Boolean(user?.isPro);

  return (
    <aside
      aria-label="Main navigation"
      className={clsx(
        "hidden lg:flex flex-col shrink-0",
        "w-[260px] h-[calc(100dvh-32px)]",
        "ml-4 my-4 sticky top-4 self-start",
        "rounded-[var(--radius-panel)]",
        "glass border border-[var(--border-light)]",
        "shadow-[var(--shadow-soft)]",
        "transition-premium"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center px-6 pt-7 pb-5 shrink-0">
        <Brand size="lg" href="/dashboard" />
      </div>

      {/* Navigation List */}
      <nav
        aria-label="Workspace navigation"
        className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-1.5"
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3.5 px-5 py-3 rounded-full transition-premium text-[15px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                isActive
                  ? "bg-white text-blue-600 font-semibold shadow-sm border border-[var(--border-light)]"
                  : "text-[var(--text-secondary)] font-medium hover:bg-white/50 hover:text-[var(--text-primary)]"
              )}
            >
              <Icon
                className={clsx(
                  "w-5 h-5 shrink-0 transition-colors",
                  isActive
                    ? "text-blue-600"
                    : "text-[var(--text-tertiary)]"
                )}
                strokeWidth={2}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Container */}
      <div className="p-3.5 mt-auto space-y-3 shrink-0">
        {/* Plan Type Card */}
        <div className="p-4 rounded-[var(--radius-card)] bg-white border border-[var(--border-light)] shadow-sm hover:shadow-md transition-premium">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              PLAN TYPE
            </span>
            <span
              className={clsx(
                "px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border transition-colors",
                isPro
                  ? "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              )}
            >
              {isPro ? "PRO" : "FREE"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--text-primary)] font-semibold truncate max-w-[130px]">
              {isPro ? "Unlimited Projects" : "3 Projects Limit"}
            </span>
            {isPro ? (
              <Link
                href="/dashboard/settings/billing"
                className="text-[12px] font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1 py-0.5 transition-colors"
              >
                Billing
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="text-[12px] font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1 py-0.5 transition-colors"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* User Profile Card */}
        <Link
          href="/dashboard/settings/profile"
          title="Edit personal details, avatar & profile"
          className="flex items-center gap-3 px-2 py-1 -mx-0.5 rounded-2xl hover:bg-white/60 transition-premium cursor-pointer group"
        >
          <div className="relative shrink-0">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || "User avatar"}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm bg-slate-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm uppercase shadow-sm border-2 border-white">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <span className="text-sm font-bold truncate text-[var(--text-primary)] group-hover:text-blue-600 transition-colors">
              {user?.name || "User"}
            </span>
            <span className="text-xs text-[var(--text-secondary)] truncate">
              {user?.email || "user@example.com"}
            </span>
          </div>
        </Link>

        {/* Logout Button */}
        <form action={signOut} className="w-full pt-0.5">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-[var(--border-light)] bg-transparent hover:border-rose-200 transition-premium shadow-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Log out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
