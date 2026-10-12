"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, ExternalLink, Edit2, Copy, Archive, ArchiveRestore, Trash2, AlertTriangle } from "lucide-react";
import { duplicateProject, archiveProject, deleteProject } from "@/app/dashboard/actions";
import { useRouter } from "next/navigation";
import { ProjectWithRelations, Project } from "@/lib/types";

interface ProjectActionsMenuProps {
  project: Project | ProjectWithRelations;
  onEdit: () => void;
}

export default function ProjectActionsMenu({ project, onEdit }: ProjectActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = async (action: () => Promise<void> | void) => {
    setIsOpen(false);
    try {
      await action();
    } catch (error) {
      console.error(error);
      alert("An error occurred performing the action.");
    }
  };

  const isArchived = !!project.archived_at;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 text-content-secondary hover:text-content hover:bg-surface-tint rounded-full transition-colors"
        aria-label="Project actions"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div 
          className="fixed sm:absolute inset-x-0 bottom-0 sm:inset-auto sm:right-0 sm:mt-2 w-full sm:w-48 bg-surface/90 sm:bg-surface/80 backdrop-blur-xl border-t sm:border border-surface-tint rounded-t-[28px] sm:rounded-[14px] shadow-[var(--shadow-card-soft)] z-50 sm:z-10 py-2 sm:py-1 overflow-hidden pb-[env(safe-area-inset-bottom)] sm:pb-1"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="w-9 h-1.5 bg-gray-300 rounded-full mx-auto my-2 sm:hidden" />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAction(() => router.push(`/dashboard/projects/${project.id}`));
            }}
            className="w-full text-left px-4 py-4 sm:py-2 text-base sm:text-[15px] text-content hover:bg-surface-tint/50 flex items-center gap-3 sm:gap-2 transition-colors"
            role="menuitem"
          >
            <ExternalLink size={18} className="sm:w-4 sm:h-4" /> Open
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
              onEdit();
            }}
            className="w-full text-left px-4 py-4 sm:py-2 text-base sm:text-[15px] text-content hover:bg-surface-tint/50 flex items-center gap-3 sm:gap-2 transition-colors"
            role="menuitem"
          >
            <Edit2 size={18} className="sm:w-4 sm:h-4" /> Edit
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAction(async () => { await duplicateProject(project.id); });
            }}
            className="w-full text-left px-4 py-4 sm:py-2 text-base sm:text-[15px] text-content hover:bg-surface-tint/50 flex items-center gap-3 sm:gap-2 transition-colors"
            role="menuitem"
          >
            <Copy size={18} className="sm:w-4 sm:h-4" /> Duplicate
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAction(() => archiveProject(project.id, !isArchived));
            }}
            className="w-full text-left px-4 py-4 sm:py-2 text-base sm:text-[15px] text-content hover:bg-surface-tint/50 flex items-center gap-3 sm:gap-2 transition-colors"
            role="menuitem"
          >
            {isArchived ? (
              <><ArchiveRestore size={18} className="sm:w-4 sm:h-4" /> Unarchive</>
            ) : (
              <><Archive size={18} className="sm:w-4 sm:h-4" /> Archive</>
            )}
          </button>

          <div className="h-px bg-surface-tint my-2 sm:my-1" />

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
              setShowDeleteConfirm(true);
            }}
            className="w-full text-left px-4 py-4 sm:py-2 text-base sm:text-[15px] text-red-500 hover:bg-red-500/10 flex items-center gap-3 sm:gap-2 transition-colors"
            role="menuitem"
          >
            <Trash2 size={18} className="sm:w-4 sm:h-4" /> Delete
          </button>
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center justify-end bg-black/40 backdrop-blur-sm sm:p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-surface w-full sm:w-[540px] rounded-t-[28px] sm:rounded-[20px] shadow-[var(--shadow-card-soft)] overflow-hidden flex flex-col mt-auto sm:mt-0 pb-[env(safe-area-inset-bottom)] sm:pb-0">
            <div className="w-9 h-1.5 bg-gray-300 rounded-full mx-auto my-3 sm:hidden" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-tint shrink-0">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="text-[17px] text-accent-primary hover:opacity-80 transition-opacity"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <div className="font-semibold text-content text-[17px]">
                Delete Project
              </div>
              <button 
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteProject(project.id);
                    if (window.location.pathname === `/dashboard/${project.id}`) {
                      router.push('/dashboard');
                    }
                  } catch (e) {
                    console.error(e);
                    alert("Failed to delete project");
                  } finally {
                    setIsDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                className="text-[17px] font-semibold text-red-500 hover:opacity-80 disabled:opacity-50 transition-opacity"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle size={24} />
              </div>
              <p className="text-content-secondary text-[15px]">
                Are you sure you want to delete <strong>{project.name}</strong>? This action will permanently remove the project and all of its associated services and tasks. This cannot be undone.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
