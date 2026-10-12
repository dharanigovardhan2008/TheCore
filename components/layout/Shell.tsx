"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Brand from "../ui/Brand";
import CommandPalette from "../ui/CommandPalette";
import NewProjectDialog from "../ui/NewProjectDialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  KeyRound, 
  MoreHorizontal,
  Plus,
  Menu,
  X,
  Users,
  Settings,
  LogOut
} from "lucide-react";
import clsx from "clsx";
import { signOut } from "@/app/dashboard/settings/actions";

const bottomNavItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { label: "To-dos", href: "/dashboard/todos", icon: CheckSquare },
  { label: "Secrets", href: "/dashboard/env", icon: KeyRound },
  { label: "Accounts", href: "/dashboard/accounts", icon: Users },
];

export default function Shell({ children, user }: { children: React.ReactNode, user?: { email: string, name: string } }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  // Close menu on Escape key and prevent background scroll when open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <div className="flex min-h-[100dvh] w-full authenticated-shell pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Desktop Sidebar */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Floating Pill Navigation Bar (Mobile & Tablet) */}
        <header className="lg:hidden fixed top-3 sm:top-4 left-0 right-0 z-30 px-4 flex justify-center pointer-events-none">
          <nav
            aria-label="Top Navigation"
            className="pointer-events-auto flex items-center justify-between gap-3 h-14 px-4 sm:px-5 rounded-full bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-[0_8px_24px_rgba(15,23,42,0.08)] max-w-sm sm:max-w-md w-full transition-all duration-200"
          >
            {/* Left: App Logo & Name */}
            <div className="flex items-center min-w-0">
              <Brand size="sm" href="/dashboard" />
            </div>

            {/* Right: + Button & 3 Lines (Menu) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsNewProjectOpen(true)}
                aria-label="Add new project"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs shadow-blue-600/30 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
                className="flex items-center justify-center w-9 h-9 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Menu className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          </nav>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 pb-28 lg:pb-8 overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Pill Bottom Navigation Dock */}
      <div className="lg:hidden fixed bottom-5 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <nav
          aria-label="Primary mobile navigation"
          className="pointer-events-auto flex items-center justify-between gap-1 p-1.5 rounded-full bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-[0_12px_36px_rgba(15,23,42,0.12)] max-w-sm w-full transition-all duration-200"
        >
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-200 min-h-[44px]",
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70"
                )}
              >
                <item.icon className={clsx("w-5 h-5 transition-transform duration-200", isActive && "scale-105")} />
                <span className="text-[10px] mt-0.5 font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Slide-over Drawer for 3 Lines Menu */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs bg-white/95 backdrop-blur-2xl m-3 sm:m-4 my-3 sm:my-4 h-[calc(100dvh-24px)] sm:h-[calc(100dvh-32px)] max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] rounded-[var(--radius-panel)] border border-slate-200/90 shadow-[var(--shadow-soft)] z-10 flex flex-col p-5 animate-in slide-in-from-right duration-200 overflow-hidden">
            {/* Header: Logo & Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <Brand size="sm" href="/dashboard" />
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm uppercase shadow-xs">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </div>

            {/* Quick Action: New Project */}
            <div className="pt-4 pb-2">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsNewProjectOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-sm shadow-xs transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Project</span>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-2 space-y-1">
              {[
                { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
                { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
                { label: "To-dos", href: "/dashboard/todos", icon: CheckSquare },
                { label: "Secrets", href: "/dashboard/env", icon: KeyRound },
                { label: "Accounts", href: "/dashboard/accounts", icon: Users },
                { label: "Settings", href: "/dashboard/settings", icon: Settings },
              ].map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer: Sign Out */}
            <div className="pt-3 border-t border-slate-100">
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Project Dialog */}
      <NewProjectDialog
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
      />

      <CommandPalette />
    </div>
  );
}
