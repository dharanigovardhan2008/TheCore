import React from 'react';
import Link from 'next/link';
import { DashboardProject, Service, Todo } from '@/lib/types';
import ProjectActionsMenu from './ProjectActionsMenu';
import { getAccentTokens } from '@/lib/colors';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import PlatformLogo from './PlatformLogo';

interface ProjectCardProps {
  project: DashboardProject;
  services?: Service[];
  todos?: Todo[];
  envFiles?: any[];
  viewMode?: 'grid' | 'list';
}

export default function ProjectCard({ project, services = [], todos = [], envFiles = [], viewMode = 'grid' }: ProjectCardProps) {
  const tokens = getAccentTokens(project.accent);
  const projectServices = services.filter(s => s.project_id === project.id);
  const stack = Array.from(new Set(projectServices.map(s => s.platform).filter(Boolean)));
  


  const initials = project.name.substring(0, 2).toUpperCase();

  return (
    <Link 
      href={`/dashboard/projects/${project.id}`}
      className="group block relative glass rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-sm)] border border-[var(--border-light)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 transition-premium"
      style={{
        '--card-accent': tokens.base,
        '--card-glow': tokens.glowLight,
      } as React.CSSProperties}
    >
      {/* Soft Glow in corner */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-0 group-hover:opacity-40 transition-premium duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, var(--card-glow), transparent 70%)` }}
      />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-4">
          {/* Logo or Fallback */}
          {project.logo_url ? (
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 border border-[var(--border-light)]">
              <Image src={project.logo_url} alt={project.name} width={48} height={48} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div 
              className="w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center font-bold text-lg border border-[var(--border-light)]"
              style={{ backgroundColor: tokens.tintLight, color: tokens.inkLight }}
            >
              {initials}
            </div>
          )}

          <div>
            <h3 className="font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--card-accent)] transition-premium">
              {project.name}
            </h3>

          </div>
        </div>

        {/* Prevent click propagation for the menu */}
        <div onClick={(e) => e.preventDefault()} className="relative z-20">
          <ProjectActionsMenu project={project} onEdit={() => {}} />
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6 min-h-[40px]">
        {project.description || "No description provided."}
      </p>

      {/* Tech Stack Pills */}
      {stack.length > 0 && (
        <div className="inline-flex items-center mb-6 bg-white rounded-full px-3 py-2 shadow-sm border border-[var(--border-light)]">
          <div className="flex items-center -space-x-2">
            {stack.slice(0, 5).map((tech, i) => (
              <PlatformLogo key={i} tech={tech} zIndex={5 - i} />
            ))}
            {stack.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-tint)] shadow-sm border border-white flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] relative z-0">
                +{stack.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-[var(--border-light)] flex items-center justify-between mt-auto">
        <span className="text-xs font-medium text-[var(--text-tertiary)]" suppressHydrationWarning>
          Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
