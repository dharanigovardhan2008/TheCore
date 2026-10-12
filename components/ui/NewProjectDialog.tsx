"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import LogoUpload from './LogoUpload';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Trash2, FolderPlus } from 'lucide-react';
import { createProjectWithServices, updateProjectWithServices, getUserEmails } from '@/app/dashboard/actions';
import * as z from 'zod';
import { ProjectWithRelations, DashboardProject, PROJECT_ACCENTS } from '@/lib/types';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: DashboardProject | ProjectWithRelations | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["idea", "in_progress", "deployed", "paused"]),
  stackString: z.string().optional(),
  repo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  live_url: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  notes: z.string().max(10000).optional().nullable(),
  accent: z.string().max(20).optional().nullable(),
  services: z.array(z.object({
    kind: z.enum(["frontend", "backend", "database", "domain", "other"]),
    custom_kind: z.string().max(40, "Max 40 characters").optional().nullable(),
    platform: z.string().min(1, "Platform is required").max(100),
    login_email: z.string().email("Must be a valid email").max(255),
  }).refine(data => {
    if (data.kind === "other" && (!data.custom_kind || data.custom_kind.trim() === "")) {
      return false;
    }
    return true;
  }, {
    message: "Type name is required when 'Other' is selected",
    path: ["custom_kind"]
  }))
});

type FormValues = z.infer<typeof formSchema>;

const PLATFORM_SUGGESTIONS = [
  "Vercel", "Netlify", "Render", "Railway", "Supabase", 
  "MongoDB Atlas", "Firebase", "Cloudflare", "GitHub Pages"
];

export default function NewProjectDialog({ isOpen, onClose, projectToEdit }: NewProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userEmails, setUserEmails] = useState<string[]>([]);

  const { register, control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'idea',
      accent: 'indigo',
      stackString: '',
      services: [],
      logo_url: null,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services"
  });

  const selectedAccent = watch('accent');
  const watchedServices = watch('services');

  useEffect(() => {
    if (isOpen) {
      getUserEmails().then(setUserEmails).catch(console.error);
      
      if (projectToEdit) {
        reset({
          name: projectToEdit.name,
          description: projectToEdit.description,
          status: projectToEdit.status as any,
          stackString: projectToEdit.stack?.join(', ') || '',
          repo_url: projectToEdit.repo_url || '',
          live_url: projectToEdit.live_url || '',
          logo_url: projectToEdit.logo_url || null,
          notes: projectToEdit.notes,
          accent: projectToEdit.accent || 'indigo',
          services: projectToEdit.services?.map(s => ({
            kind: s.kind as any,
            custom_kind: s.custom_kind,
            platform: s.platform,
            login_email: s.login_email || ''
          })) || []
        });
      } else {
        reset({
          name: '',
          description: '',
          status: 'idea',
          accent: 'indigo',
          stackString: '',
          repo_url: '',
          live_url: '',
          logo_url: null,
          notes: '',
          services: []
        });
      }
    }
  }, [isOpen, projectToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError('');
    
    const stackArray = (data.stackString || '').split(',').map(s => s.trim()).filter(Boolean);

    try {
      const projectData = {
        name: data.name,
        description: data.description,
        status: data.status,
        stack: stackArray,
        repo_url: data.repo_url,
        live_url: data.live_url,
        logo_url: data.logo_url,
        notes: data.notes,
        accent: data.accent
      };

      if (projectToEdit) {
        await updateProjectWithServices(projectToEdit.id, projectData, data.services as any);
      } else {
        await createProjectWithServices(projectData, data.services as any);
      }
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4 animate-in fade-in duration-300" role="dialog" aria-modal="true">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="glass rounded-[var(--radius-modal)] shadow-[var(--shadow-soft)] w-full sm:w-[760px] overflow-hidden flex flex-col max-h-[95dvh] sm:max-h-[90vh] relative z-10 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-12 duration-500 fill-mode-both">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-light)] shrink-0 bg-white/40 dark:bg-[#131B2C]/40 backdrop-blur-md sticky top-0 z-20">
          <button 
            type="button" 
            onClick={onClose}
            className="text-[15px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-premium font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-tint)] flex items-center justify-center text-[var(--color-primary)] shadow-sm hidden sm:flex">
              <FolderPlus className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="font-bold text-[var(--text-primary)] text-lg tracking-tight">
              {projectToEdit ? 'Edit Project' : 'New Project'}
            </div>
          </div>
          
          <button 
            type="submit" 
            form="new-project-form"
            className="text-[14px] font-semibold bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 text-white rounded-full px-5 py-2 shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-premium active:scale-95 disabled:opacity-50 disabled:scale-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="p-6 sm:p-8 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {error && (
            <div className="mb-6 p-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-sm border border-amber-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{error.replace('PLAN_LIMIT_REACHED: ', '')}</p>
                {error.includes('PLAN_LIMIT_REACHED') && (
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                    Upgrade to TheCore Pro for unlimited projects and .env vaults.
                  </p>
                )}
              </div>
              {error.includes('PLAN_LIMIT_REACHED') && (
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
                >
                  View Plans & Upgrade →
                </Link>
              )}
            </div>
          )}
          
          <form id="new-project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* BASIC DETAILS */}
            <div className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[var(--border-light)] pb-2 mb-4">
                <h3 className="font-bold text-[var(--text-primary)] text-xl tracking-tight">Basic Details</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <Controller
                    name="logo_url"
                    control={control}
                    render={({ field }) => (
                      <LogoUpload value={field.value || null} onChange={field.onChange} />
                    )}
                  />
                  <span className="text-[11px] text-[var(--text-tertiary)] text-center max-w-[112px]">Optional project logo</span>
                </div>

                <div className="flex-1 space-y-6 w-full">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Name <span className="text-[var(--color-primary)]">*</span></label>
                    <input 
                      type="text" 
                      {...register('name')} 
                      className="w-full h-12 px-4 glass hover:bg-white/40 dark:hover:bg-black/40 border border-[var(--border-light)] rounded-[var(--radius-input)] text-[15px] text-[var(--text-primary)] focus:outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium shadow-sm"
                      placeholder="Project name"
                    />
                    {errors.name && <p className="text-[var(--color-danger)] text-xs mt-2 font-medium">{errors.name.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Status</label>
                      <select 
                        {...register('status')} 
                        className="w-full h-12 px-4 glass hover:bg-white/40 dark:hover:bg-black/40 border border-[var(--border-light)] rounded-[var(--radius-input)] text-[15px] text-[var(--text-primary)] focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium appearance-none shadow-sm font-medium"
                      >
                        <option value="idea">💡 Idea</option>
                        <option value="in_progress">▶️ In Progress</option>
                        <option value="deployed">✅ Deployed</option>
                        <option value="paused">⏸️ Paused</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Tech Stack <span className="text-[var(--text-tertiary)] font-normal text-xs ml-1">(comma separated)</span></label>
                      <input 
                        type="text" 
                        {...register('stackString')} 
                        className="w-full h-12 px-4 glass hover:bg-white/40 dark:hover:bg-black/40 border border-[var(--border-light)] rounded-[var(--radius-input)] text-[15px] text-[var(--text-primary)] focus:outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium shadow-sm"
                        placeholder="React, Next.js, Supabase"
                      />
                      {watch('stackString') && (
                        <div className="flex flex-wrap gap-2 mt-3">
                           {watch('stackString')?.split(',').map(s => s.trim()).filter(Boolean).map((tech, i) => (
                             <span key={i} className="px-3 py-1 bg-[var(--bg-surface-tint)] text-[var(--text-secondary)] text-[13px] rounded-full font-medium shadow-sm border border-[var(--border-light)]">{tech}</span>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Description</label>
                <textarea 
                  {...register('description')} 
                  className="w-full h-24 px-4 py-3 glass hover:bg-white/40 dark:hover:bg-black/40 border border-[var(--border-light)] rounded-[var(--radius-input)] text-[15px] text-[var(--text-primary)] focus:outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium resize-none shadow-sm"
                  placeholder="What is this project about?"
                />
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Repository URL</label>
                    <input 
                      type="url" 
                      {...register('repo_url')} 
                      className="w-full h-12 px-4 glass hover:bg-white/40 dark:hover:bg-black/40 border border-[var(--border-light)] rounded-[var(--radius-input)] text-[15px] text-[var(--text-primary)] focus:outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium shadow-sm"
                      placeholder="https://github.com/..."
                    />
                    {errors.repo_url && <p className="text-[var(--color-danger)] text-xs mt-2 font-medium">{errors.repo_url.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Live URL</label>
                    <input 
                      type="url" 
                      {...register('live_url')} 
                      className="w-full h-12 px-4 glass hover:bg-white/40 dark:hover:bg-black/40 border border-[var(--border-light)] rounded-[var(--radius-input)] text-[15px] text-[var(--text-primary)] focus:outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium shadow-sm"
                      placeholder="https://..."
                    />
                    {errors.live_url && <p className="text-[var(--color-danger)] text-xs mt-2 font-medium">{errors.live_url.message}</p>}
                  </div>
                </div>
            </div>

            {/* PLATFORMS */}
            <div className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[var(--border-light)] pb-2 mb-4">
                <h3 className="font-bold text-[var(--text-primary)] text-xl tracking-tight">Platforms & Logins</h3>
              </div>
              
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const currentKind = watchedServices?.[index]?.kind;
                  return (
                    <div key={field.id} className="flex gap-3 items-center glass hover:bg-white/40 dark:hover:bg-black/40 border border-[var(--border-light)] p-3 rounded-[var(--radius-btn)] flex-col sm:flex-row group shadow-sm hover:shadow-[var(--shadow-sm)] transition-premium">
                      <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                        <select 
                          {...register(`services.${index}.kind`)}
                          className="w-full sm:w-[130px] h-10 px-3 bg-[var(--bg-surface)] text-sm border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium appearance-none font-medium"
                        >
                          <option value="frontend">Frontend</option>
                          <option value="backend">Backend</option>
                          <option value="database">Database</option>
                          <option value="domain">Domain</option>
                          <option value="other">Other</option>
                        </select>
                        
                        {currentKind === 'other' && (
                          <input 
                            type="text" 
                            {...register(`services.${index}.custom_kind`)} 
                            placeholder="Type"
                            className="w-full sm:w-[110px] h-10 px-3 bg-[var(--bg-surface)] text-sm border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium"
                          />
                        )}

                        <div className="w-full sm:w-[160px] relative">
                          <input 
                            type="text" 
                            {...register(`services.${index}.platform`)} 
                            list={`platforms-${index}`}
                            placeholder="Platform"
                            className="w-full h-10 px-3 bg-[var(--bg-surface)] text-sm border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium font-medium"
                          />
                          <datalist id={`platforms-${index}`}>
                            {PLATFORM_SUGGESTIONS.map(p => <option key={p} value={p} />)}
                          </datalist>
                        </div>
                        
                        <div className="flex-1 relative">
                          <input 
                            type="email" 
                            {...register(`services.${index}.login_email`)}
                            list={`emails-${index}`}
                            placeholder="user@email.com"
                            className="w-full h-10 px-3 bg-[var(--bg-surface)] text-sm border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium"
                          />
                          {(errors.services?.[index]?.login_email || errors.services?.[index]?.platform || errors.services?.[index]?.custom_kind) && (
                            <p className="text-[var(--color-danger)] text-[11px] absolute -bottom-4 left-0 font-medium">Invalid field(s)</p>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => remove(index)}
                        className="w-10 h-10 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-premium rounded-lg shrink-0 self-end sm:self-center"
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}

                <button 
                  type="button" 
                  onClick={() => append({ kind: 'frontend', custom_kind: '', platform: '', login_email: '' })}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold glass hover:bg-white/40 dark:hover:bg-black/40 text-[var(--text-secondary)] hover:text-[var(--color-primary)] border border-dashed border-[var(--border-color)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] w-full py-4 rounded-[var(--radius-btn)] transition-premium"
                >
                  <Plus size={18} className="stroke-[2.5]" /> Add Platform
                </button>
              </div>
            </div>

            {/* NOTES */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-[var(--border-light)] pb-2 mb-4">
                <h3 className="font-bold text-[var(--text-primary)] text-xl tracking-tight">Notes <span className="text-[var(--text-tertiary)] font-normal text-sm ml-1">(Optional)</span></h3>
              </div>
              
              <textarea 
                {...register('notes')} 
                className="w-full h-28 px-4 py-3 glass hover:bg-white/40 dark:hover:bg-black/40 border border-[var(--border-light)] rounded-[var(--radius-input)] text-[15px] text-[var(--text-primary)] focus:outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium resize-none shadow-sm"
                placeholder="Any important setup instructions or quick notes..."
              />
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
