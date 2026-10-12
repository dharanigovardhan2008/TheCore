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
  Sun,
  Moon
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { label: "To-dos", href: "/dashboard/todos", icon: CheckSquare },
  { label: "Secrets", href: "/dashboard/env", icon: KeyRound },
  { label: "Accounts", href: "/dashboard/accounts", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ user }: { user?: { email: string, name: string } }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-[calc(100vh-32px)] m-4 rounded-[var(--radius-panel)] glass shadow-[var(--shadow-soft)] overflow-hidden">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/logo.png" alt="TheCore" className="w-full h-full object-contain drop-shadow-sm" />
        </div>
        <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">TheCore</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-[var(--radius-btn)] transition-premium font-medium text-sm",
                isActive 
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" 
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-tint)] hover:text-[var(--text-primary)]"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Bottom Actions */}
      <div className="p-4 mt-auto border-t border-[var(--border-light)]">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-xs uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">{user?.name || 'User'}</span>
            <span className="text-xs text-[var(--text-tertiary)] truncate">{user?.email || 'user@example.com'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
