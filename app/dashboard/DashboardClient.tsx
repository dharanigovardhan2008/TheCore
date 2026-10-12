"use client";

import React, { useState, useMemo } from 'react';
import { DashboardProject, Service, Todo } from '@/lib/types';
import NewProjectDialog from '@/components/ui/NewProjectDialog';
import ProjectCard from '@/components/ui/ProjectCard';
import DonutChart from '@/components/ui/DonutChart';
import { Plus, Activity, Clock, Server, CheckCircle, FolderOpen, Play, Pause, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardClientProps {
  projects: DashboardProject[];
  services: Service[];
  todos?: Todo[];
  envFiles?: any[];
  profile?: any;
}

export default function DashboardClient({ projects, services, todos = [], envFiles = [], profile }: DashboardClientProps) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  const stats = useMemo(() => {
    const inProgress = projects.filter(p => p.status === 'in_progress').length;
    const deployed = projects.filter(p => p.status === 'deployed').length;
    const paused = projects.filter(p => p.status === 'paused').length;
    const idea = projects.filter(p => p.status === 'idea').length;

    return {
      total: projects.length,
      inProgress,
      deployed,
      paused,
      idea
    };
  }, [projects]);

  const recentProjects = [...projects].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6);

  // Generate chart data matching colors in globals.css
  const chartData = useMemo(() => [
    { label: 'Deployed', value: stats.deployed, color: 'var(--color-success)' },
    { label: 'In Progress', value: stats.inProgress, color: 'var(--color-primary)' },
    { label: 'Paused', value: stats.paused, color: 'var(--color-warning)' },
    { label: 'Idea', value: stats.idea, color: 'var(--color-accent)' },
  ].filter(d => d.value > 0), [stats]);

  const displayName = profile?.display_name ? profile.display_name.split(' ')[0] : 'User';

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] truncate">Welcome back, {displayName}</h1>
          <p className="text-[var(--text-secondary)] mt-1 truncate">Here's an overview of all your projects.</p>
        </div>
        <button 
          onClick={() => setIsNewProjectOpen(true)}
          className="flex shrink-0 items-center justify-center w-12 h-12 bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 text-white rounded-full shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-premium active:scale-95"
          aria-label="New Project"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Projects" value={stats.total} icon={<FolderOpen className="w-5 h-5 stroke-[2]" />} color="var(--color-primary)" delay="delay-100" />
        <StatCard title="In Progress" value={stats.inProgress} icon={<Play className="w-5 h-5 stroke-[2]" />} color="var(--color-primary)" delay="delay-[150ms]" />
        <StatCard title="Deployed" value={stats.deployed} icon={<CheckCircle className="w-5 h-5 stroke-[2]" />} color="var(--color-success)" delay="delay-200" />
        <StatCard title="Paused" value={stats.paused} icon={<Pause className="w-5 h-5 stroke-[2]" />} color="var(--color-warning)" delay="delay-[250ms]" />
        <StatCard title="Ideas" value={stats.idea} icon={<Lightbulb className="w-5 h-5 stroke-[2]" />} color="var(--color-accent)" delay="delay-300" />
      </div>

      {/* Main Grid: Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects by Status (Chart) */}
        <div className="lg:col-span-2 glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-8 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both hover:shadow-[var(--shadow-card-hover)] transition-premium">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Projects by Status</h2>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="relative w-48 h-48 flex-shrink-0">
              {stats.total > 0 ? (
                <DonutChart data={chartData} size={192} thickness={24} />
              ) : (
                <div className="w-full h-full rounded-full border-8 border-[var(--border-light)] flex items-center justify-center text-[var(--text-tertiary)]">
                  0
                </div>
              )}
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-3xl font-bold text-[var(--text-primary)]">{stats.total}</span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Total</span>
              </div>
            </div>
            
            {/* Chart Legend */}
            {stats.total > 0 && (
              <div className="flex flex-col gap-3">
                {chartData.map(d => (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-sm font-medium text-[var(--text-secondary)] w-24">{d.label}</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[400ms] fill-mode-both hover:shadow-[var(--shadow-card-hover)] transition-premium">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {recentProjects.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-tint)] flex items-center justify-center text-[var(--color-primary)] mt-0.5 shadow-sm">
                  <Activity className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Updated <span className="font-bold">{p.name}</span>
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 stroke-[2]" />
                    <span suppressHydrationWarning>{format(new Date(p.updated_at), 'MMM d, yyyy')}</span>
                  </p>
                </div>
              </div>
            ))}
            {recentProjects.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">No recent activity.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Projects Bottom Section */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[500ms] fill-mode-both">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Recent Projects</h2>
        </div>
        {recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recentProjects.map((project, i) => (
              <div key={project.id} className={`animate-in fade-in slide-in-from-bottom-4 fill-mode-both`} style={{ animationDelay: `${500 + i * 100}ms` }}>
                <ProjectCard
                  project={project}
                  services={services}
                  todos={todos}
                  envFiles={envFiles}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-[var(--radius-panel)] p-12 text-center shadow-[var(--shadow-sm)]">
            <FolderOpen className="w-12 h-12 text-[var(--color-primary-light)] mx-auto mb-4 stroke-[1.5]" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">No projects yet</h3>
            <p className="text-[var(--text-secondary)] mt-2 mb-6 max-w-sm mx-auto">
              Create your first project and start organizing your development stack.
            </p>
            <button 
              onClick={() => setIsNewProjectOpen(true)}
              className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 text-white rounded-full shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-premium active:scale-95"
              aria-label="Create Project"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

      {isNewProjectOpen && (
        <NewProjectDialog
          isOpen={isNewProjectOpen}
          onClose={() => setIsNewProjectOpen(false)}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, delay }: { title: string, value: number, icon: React.ReactNode, color: string, delay?: string }) {
  return (
    <div className={`glass rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card-hover)] transition-premium flex flex-col hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both ${delay || ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-[var(--radius-btn)] flex items-center justify-center shadow-sm"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {icon}
        </div>
        <span className="text-sm font-semibold text-[var(--text-secondary)]">{title}</span>
      </div>
      <div className="text-3xl font-bold text-[var(--text-primary)] mt-auto tracking-tight">
        {value}
      </div>
    </div>
  );
}
