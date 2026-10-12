"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Folder, Monitor, Mail, Plus, CheckSquare, FileKey, Moon, Sun, Keyboard, X } from "lucide-react";
import { getProjects, getAllServices } from "@/app/dashboard/actions";
import type { Project, Service } from "@/lib/types";
import { projectPath } from "@/lib/routes";

interface CommandPaletteProps {}

type ActionItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  onSelect: () => void;
};

export default function CommandPalette({}: CommandPaletteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (!isInputFocused && !isOpen) {
        if (e.key === "/") {
          e.preventDefault();
          setIsOpen(true);
        } else if (e.key === "n") {
          // Open new project dialog - via router or emit event? 
          // We can navigate to /dashboard and open it if there's a state for it, but for now let's just show palette with "New Project" selected
          e.preventDefault();
          setIsOpen(true);
          setSearch("new project");
        } else if (e.key === "?") {
          e.preventDefault();
          setShowShortcuts(true);
        }
      }

      if (isOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      getProjects().then(setProjects);
      getAllServices().then(setServices);
      
      // Auto focus after a small delay to allow transition
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Group services by email
  const emails = Array.from(new Set((services || []).map(s => s.login_email).filter(Boolean)));

  const actions: ActionItem[] = [
    { id: "action-new-proj", icon: <Plus className="w-4 h-4" />, label: "New project", onSelect: () => { setIsOpen(false); /* Ideally trigger new project dialog */ router.push('/dashboard?new=true'); } },
    { id: "action-add-todo", icon: <CheckSquare className="w-4 h-4" />, label: "Add to-do", onSelect: () => { setIsOpen(false); router.push('/dashboard/todos'); } },
    { id: "action-add-env", icon: <FileKey className="w-4 h-4" />, label: "Add .env file", onSelect: () => { setIsOpen(false); router.push('/dashboard'); /* Adjust as needed */ } },
    { id: "nav-todos", icon: <CheckSquare className="w-4 h-4" />, label: "Go to To-dos", onSelect: () => { setIsOpen(false); router.push('/dashboard/todos'); } },
    { id: "nav-accounts", icon: <Mail className="w-4 h-4" />, label: "Go to Accounts", onSelect: () => { setIsOpen(false); router.push('/dashboard/accounts'); } },
  ];

  const projectItems: ActionItem[] = (projects || []).map(p => ({
    id: `proj-${p.id}`,
    icon: <Folder className="w-4 h-4" />,
    label: p.name,
    subLabel: "Project",
    onSelect: () => { setIsOpen(false); router.push(projectPath(p.id)); }
  }));

  const platformItems: ActionItem[] = Array.from(new Set((services || []).map(s => s.platform).filter(Boolean))).map(platform => ({
    id: `plat-${platform}`,
    icon: <Monitor className="w-4 h-4" />,
    label: platform,
    subLabel: "Platform",
    onSelect: () => { setIsOpen(false); router.push('/dashboard/accounts'); }
  }));

  const emailItems: ActionItem[] = emails.map(email => ({
    id: `email-${email}`,
    icon: <Mail className="w-4 h-4" />,
    label: email,
    subLabel: "Email",
    onSelect: () => { setIsOpen(false); router.push('/dashboard/accounts'); }
  }));

  const allItems = [...actions, ...projectItems, ...platformItems, ...emailItems];

  const filteredItems = allItems.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) || 
    item.subLabel?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    }
  };

  if (showShortcuts) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
        <div className="bg-surface w-full max-w-sm rounded-[var(--radius-card)] shadow-[var(--shadow-shell-soft)] overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b border-surface-tint flex items-center justify-between">
            <h3 className="font-semibold text-content flex items-center gap-2"><Keyboard className="w-4 h-4" /> Keyboard Shortcuts</h3>
            <button onClick={() => setShowShortcuts(false)} className="text-content-hint hover:text-content">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between"><span className="text-sm text-content-secondary">Command Palette</span><kbd className="px-2 py-1 bg-surface-tint rounded text-xs text-content font-mono">Cmd K</kbd></div>
            <div className="flex items-center justify-between"><span className="text-sm text-content-secondary">Search</span><kbd className="px-2 py-1 bg-surface-tint rounded text-xs text-content font-mono">/</kbd></div>
            <div className="flex items-center justify-between"><span className="text-sm text-content-secondary">New Project</span><kbd className="px-2 py-1 bg-surface-tint rounded text-xs text-content font-mono">n</kbd></div>
            <div className="flex items-center justify-between"><span className="text-sm text-content-secondary">Shortcuts</span><kbd className="px-2 py-1 bg-surface-tint rounded text-xs text-content font-mono">?</kbd></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-2xl bg-surface/70 backdrop-blur-2xl rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-surface-tint overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-4 border-b border-surface-tint gap-3 bg-surface/40">
          <Search className="w-6 h-6 text-content-hint shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-[22px] text-content placeholder:text-content-hint font-medium"
            placeholder="Search TheCore..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <div className="max-h-[50vh] overflow-y-auto p-2 bg-surface/20">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-content-secondary text-[15px]">
              No results found.
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-[10px] text-left transition-colors ${isSelected ? 'bg-accent-primary text-white' : 'text-content hover:bg-surface-tint/50'}`}
                    onClick={item.onSelect}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className={`shrink-0 ${isSelected ? 'text-white' : 'text-content-secondary'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate text-[17px] font-medium">{item.label}</span>
                    {item.subLabel && (
                      <span className={`text-[13px] shrink-0 ml-4 ${isSelected ? 'text-white/70' : 'text-content-hint'}`}>{item.subLabel}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
