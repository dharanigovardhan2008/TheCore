"use client";

import React, { useState } from 'react';
import { DashboardProject, Service, Todo } from '@/lib/types';
import NewProjectDialog from '@/components/ui/NewProjectDialog';
import ProjectCard from '@/components/ui/ProjectCard';
import { Plus, Search, Filter, SortDesc, LayoutGrid, List, FolderOpen } from 'lucide-react';
import clsx from 'clsx';

interface ProjectsClientProps {
  projects: DashboardProject[];
  services: Service[];
  todos?: Todo[];
  envFiles?: any[];
}

export default function ProjectsClient({ projects, services, todos = [], envFiles = [] }: ProjectsClientProps) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] truncate">Projects</h1>
          <p className="text-[var(--text-secondary)] mt-1 truncate">Manage all your projects in one place.</p>
        </div>
        <button 
          onClick={() => setIsNewProjectOpen(true)}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 active:scale-95 text-white rounded-full font-semibold shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-premium"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
        <button 
          onClick={() => setIsNewProjectOpen(true)}
          className="sm:hidden flex shrink-0 items-center justify-center w-12 h-12 bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 active:scale-95 text-white rounded-full shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-premium"
          aria-label="New Project"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input 
            type="text" 
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-[var(--border-light)] rounded-[var(--radius-card)] focus:outline-none focus:border-gray-400 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-surface border border-[var(--border-light)] rounded-[var(--radius-card)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-premium whitespace-nowrap shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-surface border border-[var(--border-light)] rounded-[var(--radius-card)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-premium whitespace-nowrap shadow-sm">
            <SortDesc className="w-4 h-4" />
            Sort
          </button>
          
          <div className="flex items-center gap-1 bg-surface border border-[var(--border-light)] p-1 rounded-[var(--radius-card)] shrink-0 shadow-sm ml-auto sm:ml-0">
            <button 
              onClick={() => setViewMode('grid')}
              className={clsx(
                "p-1.5 rounded-md transition-premium",
                viewMode === 'grid' ? "bg-[var(--bg-page)] text-[var(--color-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={clsx(
                "p-1.5 rounded-md transition-premium",
                viewMode === 'list' ? "bg-[var(--bg-page)] text-[var(--color-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length > 0 ? (
        <div className={clsx(
          "gap-6",
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
            : "flex flex-col"
        )}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              services={services}
              todos={todos}
              envFiles={envFiles}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-[var(--radius-panel)] p-12 text-center shadow-[var(--shadow-sm)] border border-[var(--border-light)]">
          <FolderOpen className="w-12 h-12 text-[var(--color-primary-light)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No projects found</h3>
          <p className="text-[var(--text-secondary)] mt-2 mb-6 max-w-sm mx-auto">
            {searchQuery ? "Try adjusting your search or filters." : "Create your first project and start organizing your development stack."}
          </p>
          {!searchQuery && (
            <button 
              onClick={() => setIsNewProjectOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-[var(--radius-btn)] font-semibold shadow-sm transition-premium"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>
      )}

      {isNewProjectOpen && (
        <NewProjectDialog
          isOpen={isNewProjectOpen}
          onClose={() => setIsNewProjectOpen(false)}
        />
      )}
    </div>
  );
}

