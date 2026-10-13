"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckSquare, Mail } from "lucide-react";
import type { Project, Service, Todo } from "@/lib/types";
import DonutChart from "../ui/DonutChart";
import { toggleTodo } from "@/app/dashboard/actions";
import { STATUS_LABELS, PROJECT_ACCENTS } from "@/lib/types";

interface RightPanelProps {
  projects?: Project[];
  services?: Service[];
  todos?: Todo[];
  isMobile?: boolean;
}

export default function RightPanel({ 
  projects = [], 
  services = [], 
  todos = [], 
  isMobile = false 
}: RightPanelProps) {
  
  const [completedTodos, setCompletedTodos] = useState<Set<string>>(new Set());

  const handleToggleTodo = async (id: string) => {
    setCompletedTodos(prev => new Set(prev).add(id));
    await toggleTodo(id, true);
  };

  const stats = useMemo(() => {
    const deployed = (projects || []).filter(p => p.status === 'deployed').length;
    const inProgress = (projects || []).filter(p => p.status === 'in_progress').length;
    const idea = (projects || []).filter(p => p.status === 'idea').length;
    const paused = (projects || []).filter(p => p.status === 'paused').length;

    return [
      { label: 'deployed', value: deployed, color: '#2563EB' },
      { label: 'in_progress', value: inProgress, color: 'var(--color-orange)' },
      { label: 'idea', value: idea, color: '#CBD5E1' },
      { label: 'paused', value: paused, color: '#94A3B8' }
    ];
  }, [projects]);

  const needsAttention = useMemo(() => {
    const attention: { id: string; projectId: string; projectName: string; reason: string }[] = [];
    const now = new Date();

    (projects || []).forEach(p => {
      // Deployed with no live URL
      if (p.status === 'deployed' && !p.live_url) {
        attention.push({ id: `no-url-${p.id}`, projectId: p.id, projectName: p.name, reason: "Deployed but no live URL" });
      }

      // No platform (no services) - skip idea projects
      if (p.status !== 'idea') {
        const hasServices = (services || []).some(s => s.project_id === p.id);
        if (!hasServices) {
          attention.push({ id: `no-plat-${p.id}`, projectId: p.id, projectName: p.name, reason: "No platform attached" });
        }
      }

      // Stale projects (not updated for 60 days)
      const daysSinceUpdate = (now.getTime() - new Date(p.updated_at).getTime()) / (1000 * 3600 * 24);
      if (daysSinceUpdate > 60 && !p.archived_at) {
        attention.push({ id: `stale-${p.id}`, projectId: p.id, projectName: p.name, reason: "Stale (60+ days)" });
      }
    });

    // Overdue todos
    (todos || []).forEach(t => {
      if (!t.done && t.due_date && new Date(t.due_date) < now) {
        const p = (projects || []).find(proj => proj.id === t.project_id);
        if (p) {
          attention.push({ id: `overdue-${t.id}`, projectId: p.id, projectName: p.name, reason: `Overdue to-do: ${t.text}` });
        }
      }
    });

    return attention.slice(0, 5);
  }, [projects, services, todos]);

  const nextTodos = useMemo(() => {
    return (todos || [])
      .filter(t => !t.done && !completedTodos.has(t.id))
      .sort((a, b) => {
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        const prioMap = { high: 0, med: 1, low: 2 };
        return (prioMap[a.priority as keyof typeof prioMap] ?? 3) - (prioMap[b.priority as keyof typeof prioMap] ?? 3);
      })
      .slice(0, 5);
  }, [todos, completedTodos]);

  const platformsByEmail = useMemo(() => {
    const counts: Record<string, number> = {};
    (services || []).forEach(s => {
      if (s.login_email) {
        counts[s.login_email] = (counts[s.login_email] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([email, count]) => ({ email, count }));
  }, [services]);

  const getAccentClass = (accent?: string | null) => {
    return PROJECT_ACCENTS.find(a => a.value === accent)?.class || 'bg-slate-300';
  };
  
  const getProject = (id: string) => projects.find(p => p.id === id);

  return (
    <aside className="w-full xl:w-[320px] xl:h-[calc(100%-2rem)] xl:my-4 xl:mr-4 bg-surface rounded-[24px] shadow-[0_10px_40px_rgba(60,70,120,0.08)] flex flex-col p-6 shrink-0 z-20 mb-8 xl:mb-0">
      
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 flex flex-col gap-8 custom-scrollbar">
        
        {/* Overview Chart */}
        <div>
          <h2 className="text-lg font-semibold text-content mb-6 text-center">Overview</h2>
          <DonutChart data={stats} />
          
          <div className="mt-6 flex flex-col gap-2">
            {stats.map(s => {
              if (s.value === 0) return null;
              const percent = Math.round((s.value / projects.length) * 100);
              return (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color === 'var(--color-indigo)' || s.color === '#2563EB' ? '#2563EB' : s.color === 'var(--color-orange)' ? '#FF7A2F' : s.color }} />
                    <span className="text-content-secondary capitalize">{s.label.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-content">{s.value}</span>
                    <span className="text-content-hint text-xs w-8 text-right">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-content mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-accent-secondary" />
              Needs attention
            </h3>
            <div className="flex flex-col gap-3">
              {needsAttention.map(item => (
                <Link key={item.id} href={`/dashboard/projects/${item.projectId}`} className="block bg-surface-tint/50 rounded-lg p-3 hover:bg-surface-tint transition-colors">
                  <div className="text-xs font-medium text-content mb-1">{item.projectName}</div>
                  <div className="text-xs text-accent-secondary/90">{item.reason}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Next To-dos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-content flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-content-secondary" />
              Next to-dos
            </h3>
            <Link href="/dashboard/todos" className="text-xs text-accent-primary hover:underline">View all</Link>
          </div>
          {nextTodos.length === 0 ? (
            <p className="text-xs text-content-hint">No open to-dos.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {nextTodos.map(todo => {
                const project = getProject(todo.project_id);
                return (
                  <div key={todo.id} className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      className="mt-0.5 rounded-[4px] border-surface-tint text-blue-600 focus:ring-blue-500/20 bg-transparent shrink-0" 
                      onChange={() => handleToggleTodo(todo.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-content leading-tight mb-1">{todo.text}</p>
                      <div className="flex items-center gap-2">
                        {project && (
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${getAccentClass(project.accent)}`} />
                            <span className="text-[10px] text-content-hint truncate max-w-[100px]">{project.name}</span>
                          </div>
                        )}
                        {todo.due_date && (
                          <span className="text-[10px] font-medium text-content-secondary bg-surface-tint px-1.5 py-0.5 rounded">
                            <span suppressHydrationWarning>{new Date(todo.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Platforms by Email */}
        {platformsByEmail.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-content mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-content-secondary" />
              Accounts
            </h3>
            <div className="flex flex-col gap-2">
              {platformsByEmail.map(item => (
                <Link key={item.email} href="/dashboard/accounts" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-tint transition-colors group">
                  <span className="text-sm text-content-secondary group-hover:text-content transition-colors truncate pr-2">{item.email}</span>
                  <span className="text-xs font-medium text-content bg-surface-tint px-2 py-0.5 rounded-full shrink-0">{item.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
