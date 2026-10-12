"use client";

import React from "react";
import Sidebar from "./Sidebar";

import CommandPalette from "../ui/CommandPalette";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  KeyRound, 
  MoreHorizontal
} from "lucide-react";
import clsx from "clsx";

const bottomNavItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { label: "To-dos", href: "/dashboard/todos", icon: CheckSquare },
  { label: "Secrets", href: "/dashboard/env", icon: KeyRound },
  { label: "More", href: "/dashboard/settings", icon: MoreHorizontal },
];

export default function Shell({ children, user }: { children: React.ReactNode, user?: { email: string, name: string } }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 glass z-40 pb-[env(safe-area-inset-bottom)] px-2">
        <div className="flex items-center justify-around h-full">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center w-16 h-full gap-1 transition-premium",
                  isActive ? "text-[var(--color-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <CommandPalette />
    </div>
  );
}
