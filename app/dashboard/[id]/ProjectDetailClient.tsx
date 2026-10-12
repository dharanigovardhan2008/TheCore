"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectWithRelations, Service } from "@/lib/types";
import { updateProject, createService, deleteService, deleteProject } from "@/app/dashboard/actions";
import StatusBadge from "@/components/ui/StatusBadge";
import TodoList from "@/components/ui/TodoList";
import { EnvVault } from "@/components/ui/EnvVault";
import NewProjectDialog from "@/components/ui/NewProjectDialog";
import ProjectActionsMenu from "@/components/ui/ProjectActionsMenu";
import PlatformLogo from "@/components/ui/PlatformLogo";
import { ArrowLeft, ExternalLink, Copy, Trash2, Edit2, Save, X, Globe, GitBranch } from "lucide-react";
import Image from "next/image";
import { getAccentTokens } from "@/lib/colors";

interface Props {
  project: ProjectWithRelations;
}

export default function ProjectDetailClient({ project }: Props) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(project.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const tokens = getAccentTokens(project.accent);
  const initials = project.name.substring(0, 2).toUpperCase();

  const [services, setServices] = useState<Service[]>(project.services || []);
  const [newServiceKind, setNewServiceKind] = useState("database");
  const [newPlatform, setNewPlatform] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isAddingService, setIsAddingService] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();

  const handleDeleteProject = async () => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateProject(project.id, {
        name: project.name,
        description: project.description,
        status: project.status,
        stack: project.stack || [],
        repo_url: project.repo_url,
        live_url: project.live_url,
        notes,
        accent: project.accent,
      });
      setIsEditingNotes(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatform.trim() || !newEmail.trim() || isAddingService) return;
    
    setIsAddingService(true);
    try {
      const added = await createService({
        project_id: project.id,
        kind: newServiceKind as any,
        platform: newPlatform.trim(),
        login_email: newEmail.trim()
      });
      if (added) {
        setServices([...services, added]);
        setNewPlatform("");
        setNewEmail("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteService(id);
      setServices(services.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
        <div className="flex flex-col gap-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-premium">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
          <div className="flex items-center gap-5 flex-wrap mt-2">
            {project.logo_url ? (
              <div className="w-20 h-20 rounded-[20px] overflow-hidden shadow-[var(--shadow-sm)] flex-shrink-0 border border-[var(--border-light)] bg-[var(--bg-surface)] p-0.5">
                <Image src={project.logo_url} alt={project.name} width={80} height={80} className="object-cover w-full h-full rounded-[16px]" />
              </div>
            ) : (
              <div 
                className="w-20 h-20 rounded-[20px] shadow-[var(--shadow-sm)] flex items-center justify-center font-bold text-3xl border border-[var(--border-light)]"
                style={{ backgroundColor: tokens.tintLight, color: tokens.inkLight }}
              >
                {initials}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight break-all leading-none">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={project.status} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={() => setIsEditDialogOpen(true)}
            className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 rounded-full shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-premium active:scale-95"
          >
            Edit Project
          </button>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-full shadow-sm">
            <ProjectActionsMenu project={project} onEdit={() => setIsEditDialogOpen(true)} />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
        
        {/* Details Card */}
        <div className="lg:col-span-2 order-1 glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-8 hover:shadow-[var(--shadow-card-hover)] transition-premium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          {project.description && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Description</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">{project.description}</p>
            </div>
          )}

          {project.stack && project.stack.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-[var(--bg-surface-tint)] text-[var(--text-secondary)] text-[13px] rounded-full border border-[var(--border-light)] font-medium shadow-sm flex items-center gap-1.5">
                    <PlatformLogo tech={tech} className="!w-4 !h-4 !p-0" />
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(project.repo_url || project.live_url) && (
            <div className="pt-2">
              <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.live_url && (
                  <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-[var(--bg-surface-tint)] hover:bg-[var(--color-primary-light)] border border-[var(--border-light)] hover:border-[var(--color-primary)] rounded-[var(--radius-btn)] transition-premium group">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--color-primary)] shadow-sm">
                      <Globe className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-secondary)] mb-0.5">Live URL</div>
                      <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] truncate">{project.live_url.replace(/^https?:\/\//, '')}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-premium" />
                  </a>
                )}
                {project.repo_url && (
                  <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-[var(--bg-surface-tint)] hover:bg-[var(--color-primary-light)] border border-[var(--border-light)] hover:border-[var(--color-primary)] rounded-[var(--radius-btn)] transition-premium group">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--color-primary)] shadow-sm">
                      <GitBranch className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-secondary)] mb-0.5">Repository</div>
                      <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] truncate">{project.repo_url.replace(/^https?:\/\//, '').replace('github.com/', '')}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-premium" />
                  </a>
                )}
              </div>
            </div>
          )}

          {(!project.description && (!project.stack || project.stack.length === 0) && !project.repo_url && !project.live_url) && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-[var(--bg-surface-tint)] rounded-full flex items-center justify-center text-[var(--text-tertiary)] mb-3">
                <Edit2 className="w-5 h-5" />
              </div>
              <h4 className="text-[var(--text-primary)] font-bold mb-1">No details added</h4>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm">Edit the project to add a description, tech stack, and URLs.</p>
            </div>
          )}
        </div>

        {/* Right panel area (To-dos) comes second on mobile, but stays on the right on desktop */}
        <div className="lg:col-span-1 lg:row-span-4 order-2 lg:order-2 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
          <TodoList projectId={project.id} initialTodos={project.todos || []} />
        </div>

        {/* Notes Card */}
        <div className="lg:col-span-2 order-3 glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-8 hover:shadow-[var(--shadow-card-hover)] transition-premium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Notes</h2>
            {!isEditingNotes ? (
              <button 
                onClick={() => setIsEditingNotes(true)}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-premium rounded-full"
              >
                <Edit2 className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setIsEditingNotes(false); setNotes(project.notes || ""); }}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-premium rounded-full"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button 
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 text-white text-sm font-bold rounded-full shadow-[0_4px_12px_rgba(79,70,229,0.3)] disabled:opacity-50 transition-premium active:scale-95"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            )}
          </div>
          
          {isEditingNotes ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[200px] p-4 text-[15px] bg-[var(--bg-page)] border border-[var(--border-light)] rounded-[var(--radius-input)] outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 text-[var(--text-primary)] resize-y shadow-sm transition-premium"
              placeholder="Write project notes here..."
            />
          ) : (
            <div className="whitespace-pre-wrap text-[15px] text-[var(--text-secondary)] leading-relaxed min-h-[100px] bg-[var(--bg-surface-tint)]/50 p-4 rounded-[var(--radius-input)] border border-[var(--border-light)]/50">
              {notes || <span className="italic text-[var(--text-tertiary)]">No notes added yet. Click the edit icon to add some.</span>}
            </div>
          )}
        </div>
        
        {/* Services Card */}
        <div className="lg:col-span-2 order-4 glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-8 hover:shadow-[var(--shadow-card-hover)] transition-premium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
           <div className="mb-6">
             <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">Platforms & logins</h2>
             <p className="text-xs text-[var(--text-tertiary)] font-medium">Store only login emails here. Use a password manager for passwords.</p>
           </div>
           
           <div className="space-y-3 mb-6">
              {services.map(service => (
                <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 glass border border-[var(--border-light)] rounded-[var(--radius-btn)] gap-3 sm:gap-0 group hover:shadow-[var(--shadow-soft)] hover:bg-white/40 dark:hover:bg-black/40 transition-premium shadow-sm">
                  <div className="flex items-start sm:items-center gap-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[var(--bg-page)] rounded-md text-[var(--text-secondary)] border border-[var(--border-light)] shadow-sm shrink-0">
                      {service.kind === 'other' && service.custom_kind ? service.custom_kind : service.kind}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <PlatformLogo tech={service.platform} className="!w-5 !h-5 !p-0.5" />
                        <span className="text-[15px] font-bold text-[var(--text-primary)]">{service.platform}</span>
                      </div>
                      <span className="text-[14px] text-[var(--text-secondary)] truncate font-medium">{service.login_email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end shrink-0">
                    <button onClick={() => copyToClipboard(service.login_email)} className="w-9 h-9 bg-[var(--bg-page)] rounded-full text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-premium flex items-center justify-center shadow-sm" title="Copy email">
                      <Copy className="w-4 h-4 stroke-[2]" />
                    </button>
                    <button onClick={() => handleDeleteService(service.id)} className="w-9 h-9 bg-[var(--bg-page)] rounded-full text-[var(--color-danger)] hover:text-white hover:bg-[var(--color-danger)] transition-premium flex items-center justify-center shadow-sm" title="Delete">
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    </button>
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <div className="py-6 text-center border border-dashed border-[var(--border-color)] rounded-[var(--radius-btn)]">
                  <p className="text-sm font-medium text-[var(--text-tertiary)]">No platforms added yet.</p>
                </div>
              )}
           </div>

          <form onSubmit={handleAddService} className="flex flex-col sm:flex-row gap-3 w-full glass p-3 rounded-[var(--radius-input)] border border-[var(--border-light)]">
              <select
                value={newServiceKind}
                onChange={(e) => setNewServiceKind(e.target.value)}
                className="h-11 sm:h-10 text-[14px] font-medium bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-3 outline-none w-full sm:w-auto focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 shadow-sm transition-premium"
              >
                <option value="hosting">Hosting</option>
                <option value="database">Database</option>
                <option value="auth">Auth</option>
                <option value="analytics">Analytics</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                placeholder="Platform (e.g. Vercel)"
                className="h-11 sm:h-10 text-[14px] bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-4 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 outline-none flex-1 w-full shadow-sm transition-premium font-medium"
              />
              <input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Login Email"
                className="h-11 sm:h-10 text-[14px] bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-4 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 outline-none flex-1 w-full shadow-sm transition-premium font-medium"
              />
              <button 
                type="submit" 
                disabled={isAddingService || !newPlatform.trim() || !newEmail.trim()}
                className="h-11 sm:h-10 w-full sm:w-auto bg-[var(--text-primary)] hover:bg-[var(--color-primary)] text-white px-5 rounded-lg disabled:opacity-50 text-[14px] font-bold whitespace-nowrap shadow-sm transition-premium"
              >
                Add
              </button>
             </form>
        </div>
        
        {/* EnvVault Card */}
        <div className="lg:col-span-2 order-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[400ms] fill-mode-both">
          <EnvVault projectId={project.id} />
        </div>
      </div>

      <NewProjectDialog 
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        projectToEdit={project}
      />
    </div>
  );
}
