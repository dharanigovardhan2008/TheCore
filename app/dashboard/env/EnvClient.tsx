"use client";

import React, { useState, useEffect, useRef } from "react";
import { useVault } from "@/components/providers/VaultProvider";
import { EnvFile, Project, PROJECT_ACCENTS } from "@/lib/types";
import { Lock, Search, Plus, Calendar, Unlock, FileCode, MoreVertical, Edit, Download, Copy, Trash, Loader2, ChevronDown, ChevronUp, Eye, EyeOff, X, Save, Check } from "lucide-react";
import clsx from "clsx";
import { decryptText, encryptText, EncryptedData } from '@/lib/crypto';
import { parseEnv, stringifyEnv } from '@/lib/dotenv';
import { deleteEnvFile, upsertEnvFile } from '../vaultActions';
import { EnvFileModal } from "@/components/ui/EnvFileModal";
import { UnlockVaultModal } from "@/components/ui/UnlockVaultModal";
import LoadingOrb from "@/components/ui/LoadingOrb";

interface EnvClientProps {
  envFiles: EnvFile[];
  projects: Project[];
}

export default function EnvClient({ envFiles, projects }: EnvClientProps) {
  const { isLocked, lock, masterPassword } = useVault();
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    if (!isLocked && masterPassword) {
      setDecrypting(true);
      Promise.all(envFiles.map(async (f) => {
        try {
          const text = await decryptText(f as unknown as EncryptedData, masterPassword);
          return { id: f.id, text };
        } catch {
          return { id: f.id, text: '' };
        }
      })).then((results) => {
        const map: Record<string, string> = {};
        results.forEach(r => map[r.id] = r.text);
        setDecrypted(map);
        setDecrypting(false);
      });
    } else {
      setDecrypted({});
    }
  }, [isLocked, masterPassword, envFiles]);

  const handleAddSave = async (projectId: string, fileName: string, label: string, content: string) => {
    if (!masterPassword) throw new Error("Vault is locked");
    const encrypted = await encryptText(content, masterPassword);
    await upsertEnvFile(projectId, fileName, label, encrypted, '1.0');
  };

  const filteredFiles = envFiles.filter((file) => {
    const pName = projects.find((p) => p.id === file.project_id)?.name || "Unknown Project";
    
    if (isLocked) {
        const matchesSearch =
          file.file_name.toLowerCase().includes(search.toLowerCase()) ||
          (file.label && file.label.toLowerCase().includes(search.toLowerCase())) ||
          pName.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    } else {
        const content = decrypted[file.id] || '';
        const parsed = parseEnv(content);
        const keys = parsed.filter(p => p.type === 'variable').map(p => p.key || '');
        const searchLower = search.toLowerCase();
        return file.file_name.toLowerCase().includes(searchLower) ||
          (file.label && file.label.toLowerCase().includes(searchLower)) ||
          pName.toLowerCase().includes(searchLower) ||
          keys.some(k => k.toLowerCase().includes(searchLower));
    }
  });

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-8 h-full overflow-y-auto pb-12 pr-2 custom-scrollbar">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">.env files</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative group w-full sm:w-64 order-last sm:order-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] group-focus-within:text-[var(--text-secondary)] transition-colors" />
            <input
              type="text"
              placeholder="Search .env files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 sm:h-10 glass pl-10 pr-4 rounded-[var(--radius-btn)] border border-[var(--border-light)] focus:outline-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:border-transparent text-base sm:text-sm transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            disabled={isLocked}
            className="flex-1 sm:flex-none h-11 sm:h-10 px-4 justify-center bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8]/90 disabled:opacity-50 text-white rounded-[var(--radius-btn)] text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add .env file
          </button>
          {isLocked ? (
            <button
              onClick={() => setIsUnlockModalOpen(true)}
              className="flex-1 sm:flex-none h-11 sm:h-10 px-4 justify-center glass hover:glass-tint text-[var(--text-primary)] rounded-[var(--radius-btn)] border border-[var(--border-light)] text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Unlock
            </button>
          ) : (
            <button
              onClick={() => lock()}
              className="flex-1 sm:flex-none h-11 sm:h-10 px-4 justify-center glass hover:glass-tint text-[var(--text-primary)] rounded-[var(--radius-btn)] border border-[var(--border-light)] text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Lock
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      {isLocked ? (
        <LockedState filteredFiles={filteredFiles} projects={projects} onUnlock={() => setIsUnlockModalOpen(true)} />
      ) : (
        decrypting ? (
            <div className="flex flex-col items-center justify-center py-20">
                <LoadingOrb
                  state="listening"
                  size={64}
                  label="Decrypting vault..."
                  sublabel="Deriving keys and parsing environment variables"
                />
            </div>
        ) : (
            <UnlockedState 
                filteredFiles={filteredFiles} 
                projects={projects} 
                decrypted={decrypted} 
                masterPassword={masterPassword!} 
            />
        )
      )}

      <EnvFileModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleAddSave} 
        projects={projects} 
      />

      <UnlockVaultModal 
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
      />
    </div>
  );
}

function LockedState({ filteredFiles, projects, onUnlock }: { filteredFiles: EnvFile[], projects: Project[], onUnlock: () => void }) {
    return (
        <div className="flex flex-col gap-6">
          <div className="glass border border-[var(--border-light)] rounded-[var(--radius-card)] p-12 text-center flex flex-col items-center justify-center shadow-[var(--shadow-sm)] mb-8 mt-4">
            <div className="w-20 h-20 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Lock className="w-10 h-10 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Vault is Locked</h2>
            <p className="text-[var(--text-secondary)] max-w-md mb-8 text-[15px] leading-relaxed">
              Your environment variables are encrypted using your 4-digit PIN. 
              Unlock the vault to view or edit the contents of your .env files.
            </p>
            <button
              onClick={onUnlock}
              className="h-12 px-8 bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-premium active:scale-95 text-white rounded-full text-[15px] font-semibold flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Unlock Vault
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const project = projects.find((p) => p.id === file.project_id);
              return (
                <div key={file.id} className="glass border border-[var(--border-light)] rounded-[var(--radius-card)] p-6 flex flex-col gap-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-soft)] transition-premium bg-white/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg truncate" title={file.file_name}>{file.file_name}</h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate" title={project?.name || 'Unknown Project'}>
                        {project?.name || 'Unknown Project'}
                      </p>
                    </div>
                    {file.label && (
                      <span className="text-xs glass-tint px-2 py-1 rounded-md text-[var(--text-secondary)] shrink-0">
                        {file.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto pt-4 flex items-center text-xs text-[var(--text-tertiary)] border-t border-[var(--border-light)]">
                    <Calendar className="w-3 h-3 mr-1.5" />
                    Updated <span suppressHydrationWarning>{new Date(file.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
            {filteredFiles.length === 0 && (
              <div className="col-span-full py-12 text-center text-[var(--text-tertiary)]">
                No environment files found.
              </div>
            )}
          </div>
        </div>
    );
}

function UnlockedState({ filteredFiles, projects, decrypted, masterPassword }: { filteredFiles: EnvFile[], projects: Project[], decrypted: Record<string, string>, masterPassword: string }) {
    const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
    const [viewModalFile, setViewModalFile] = useState<EnvFile | null>(null);

    const toggleProject = (pid: string) => {
        setExpandedProjects(prev => ({ ...prev, [pid]: !prev[pid] }));
    };

    const groupedFiles = filteredFiles.reduce((acc, file) => {
        const pid = file.project_id;
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(file);
        return acc;
    }, {} as Record<string, EnvFile[]>);

    return (
        <div className="flex flex-col gap-6">
            {Object.entries(groupedFiles).map(([pid, files]) => {
                const project = projects.find((p) => p.id === pid);
                if (!project) return null;
                const isExpanded = expandedProjects[pid] !== false; // default true
                const accent = PROJECT_ACCENTS.find(a => a.value === project.accent) || PROJECT_ACCENTS[0];

                return (
                    <div key={pid} className="flex flex-col gap-3">
                        <button 
                            onClick={() => toggleProject(pid)}
                            className="flex items-center gap-3 text-left group"
                        >
                            <ChevronDown className={clsx("w-5 h-5 text-[var(--text-tertiary)] transition-transform", !isExpanded && "-rotate-90")} />
                            <div className={clsx("w-3 h-3 rounded-full", accent.class)} />
                            <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{project.name}</h2>
                            <span className="text-sm font-semibold text-[var(--text-secondary)] glass-tint px-2 py-0.5 rounded-full">
                                {files.length}
                            </span>
                        </button>
                        
                        {isExpanded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-8">
                                {files.map(file => (
                                    <FileCard 
                                        key={file.id} 
                                        file={file} 
                                        content={decrypted[file.id] || ''} 
                                        onOpen={() => setViewModalFile(file)}
                                        masterPassword={masterPassword}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {filteredFiles.length === 0 && (
                <div className="py-12 text-center text-[var(--text-tertiary)] glass rounded-[var(--radius-card)] border border-[var(--border-light)]">
                    No matching environment files found.
                </div>
            )}

            {viewModalFile && (
                <FileViewModal 
                    file={viewModalFile} 
                    initialContent={decrypted[viewModalFile.id] || ''}
                    onClose={() => setViewModalFile(null)}
                    masterPassword={masterPassword}
                />
            )}
        </div>
    );
}

function FileCard({ file, content, onOpen, masterPassword }: { file: EnvFile, content: string, onOpen: () => void, masterPassword: string }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const parsed = parseEnv(content);
    const varCount = parsed.filter(p => p.type === 'variable').length;
    const [deleting, setDeleting] = useState(false);

    const handleCopyAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(content);
        setMenuOpen(false);
        setTimeout(() => navigator.clipboard.writeText(''), 30000); // clear after 30s
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setMenuOpen(false);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this .env file?")) {
            setDeleting(true);
            await deleteEnvFile(file.id);
            setDeleting(false);
        }
        setMenuOpen(false);
    };

    const handleDuplicate = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newName = file.file_name + '.copy';
        const encrypted = await encryptText(content, masterPassword);
        await upsertEnvFile(file.project_id, newName, file.label, encrypted, '1.0');
        setMenuOpen(false);
    };

    return (
        <div 
            onClick={onOpen}
            className="glass border border-[var(--border-light)] rounded-[var(--radius-card)] p-6 flex flex-col gap-4 cursor-pointer hover:shadow-[var(--shadow-soft)] transition-premium relative group bg-white/60"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-medium text-lg truncate pr-8" title={file.file_name}>{file.file_name}</h3>
                    {file.label && (
                        <span className="text-xs glass-tint px-2 py-1 rounded-md text-[var(--text-secondary)] mt-1 inline-block">
                        {file.label}
                        </span>
                    )}
                </div>
                
                <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--bg-page)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 glass rounded-[var(--radius-btn)] shadow-[var(--shadow-shell-soft)] border border-[var(--border-light)] py-1 z-10 flex flex-col text-sm font-medium">
                            <button onClick={onOpen} className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-page)] text-left">
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-page)] text-left">
                                <Download className="w-4 h-4" /> Download
                            </button>
                            <button onClick={handleCopyAll} className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-page)] text-left">
                                <Copy className="w-4 h-4" /> Copy all
                            </button>
                            <button onClick={handleDuplicate} className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-page)] text-left">
                                <FileCode className="w-4 h-4" /> Duplicate
                            </button>
                            <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-left disabled:opacity-50">
                                <Trash className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-[var(--border-light)]">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-semibold">
                    <span>{varCount} Variables</span>
                </div>
                <div className="flex items-center text-xs text-[var(--text-tertiary)]">
                    <Calendar className="w-3 h-3 mr-1.5" />
                    Updated <span suppressHydrationWarning>{new Date(file.updated_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
}

function FileViewModal({ file, initialContent, onClose, masterPassword }: { file: EnvFile, initialContent: string, onClose: () => void, masterPassword: string }) {
    const [view, setView] = useState<'variables'|'raw'>('variables');
    const [content, setContent] = useState(initialContent);
    const [saving, setSaving] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const parsed = parseEnv(content);
    const variables = parsed.filter(p => p.type === 'variable');

    const handleSave = async () => {
        setSaving(true);
        try {
            const encrypted = await encryptText(content, masterPassword);
            await upsertEnvFile(file.project_id, file.file_name, file.label, encrypted, '1.0', file.id);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center justify-end bg-black/50 backdrop-blur-sm sm:p-4">
            <div className="glass w-full sm:max-w-4xl rounded-[var(--radius-modal)] shadow-[var(--shadow-shell-soft)] flex flex-col overflow-hidden max-h-[90dvh] sm:max-h-[90vh] mt-auto sm:mt-0 pb-[env(safe-area-inset-bottom)] sm:pb-0">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-light)] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex w-10 h-10 rounded-full bg-[var(--color-primary-light)] items-center justify-center text-[var(--color-primary)]">
                            <FileCode className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span className="truncate max-w-[150px] sm:max-w-xs">{file.file_name}</span>
                                {file.label && <span className="text-xs glass-tint px-2 py-0.5 rounded text-[var(--text-secondary)] font-semibold shrink-0">{file.label}</span>}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="bg-[var(--bg-page)] p-1 rounded-[var(--radius-btn)] flex font-semibold text-xs sm:text-sm">
                            <button 
                                onClick={() => setView('variables')}
                                className={clsx("px-2 sm:px-4 py-1.5 rounded-[var(--radius-btn)] transition-colors", view === 'variables' ? 'bg-white shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')}
                            >
                                Variables
                            </button>
                            <button 
                                onClick={() => setView('raw')}
                                className={clsx("px-2 sm:px-4 py-1.5 rounded-[var(--radius-btn)] transition-colors", view === 'raw' ? 'bg-white shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')}
                            >
                                Raw
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)] rounded-full transition-colors hidden sm:block">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--bg-page)]/50">
                    {view === 'raw' ? (
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full min-h-[400px] p-4 font-mono text-sm glass border border-[var(--border-color)] rounded-[var(--radius-card)] outline-none focus:border-accent-primary transition-colors text-[var(--text-primary)] resize-none"
                            spellCheck={false}
                        />
                    ) : (
                        <div className="glass border border-[var(--border-color)] rounded-[var(--radius-card)] overflow-hidden">
                            {variables.length === 0 ? (
                                <div className="p-8 text-center text-[var(--text-tertiary)]">No variables found.</div>
                            ) : (
                                <>
                                    <div className="hidden sm:block">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[var(--bg-page)] border-b border-[var(--border-color)] text-sm text-[var(--text-secondary)] font-semibold">
                                                    <th className="py-3 px-4 w-1/3">KEY</th>
                                                    <th className="py-3 px-4 w-1/2">VALUE</th>
                                                    <th className="py-3 px-4 w-1/6 text-right">ACTIONS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variables.map((v, i) => (
                                                    <VariableRow key={i} variable={v} onCopy={(k) => setCopiedKey(k)} copied={copiedKey === v.key} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="block sm:hidden flex flex-col gap-2 p-2 bg-[var(--bg-page)]/50">
                                        {variables.map((v, i) => (
                                            <MobileVariableCard key={i} variable={v} onCopy={(k) => setCopiedKey(k)} copied={copiedKey === v.key} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-6 border-t border-[var(--border-light)] flex justify-between items-center glass shrink-0">
                    <p className="text-sm text-[var(--text-secondary)] hidden sm:block">
                        Editing as <strong>{view}</strong>
                    </p>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-2 rounded-[var(--radius-btn)] font-semibold text-[var(--text-secondary)] hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || content === initialContent}
                            className="flex-1 sm:flex-none justify-center px-4 sm:px-6 py-3 sm:py-2 rounded-[var(--radius-btn)] font-semibold bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-premium active:scale-95 text-white transition-opacity flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MobileVariableCard({ variable, onCopy, copied }: { variable: any, onCopy: (k: string) => void, copied: boolean }) {
    const [revealed, setRevealed] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(variable.value || '');
        onCopy(variable.key);
        setTimeout(() => {
            onCopy('');
        }, 3000); // 3 seconds is more reasonable for mobile
    };

    return (
        <div className="glass rounded-lg p-3 border border-[var(--border-color)] flex flex-col gap-2 shadow-sm">
            <div className="font-mono text-sm text-[var(--text-primary)] font-bold break-all">
                {variable.key}
            </div>
            <div className="flex justify-between items-end gap-2 mt-1">
                <div className="font-mono text-sm text-[var(--text-secondary)] break-all flex-1 pb-1">
                    {revealed ? variable.value : '•'.repeat(Math.min(15, variable.value?.length || 5))}
                </div>
                <div className="flex gap-1 shrink-0">
                    <button onClick={() => setRevealed(!revealed)} className="p-2 bg-[var(--bg-page)] rounded-md text-[var(--text-secondary)] active:bg-gray-200 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]">
                        {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={handleCopy} className="p-2 bg-[var(--bg-page)] rounded-md text-[var(--text-secondary)] active:bg-gray-200 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

function VariableRow({ variable, onCopy, copied }: { variable: any, onCopy: (k: string) => void, copied: boolean }) {
    const [revealed, setRevealed] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(variable.value || '');
        onCopy(variable.key);
        setTimeout(() => {
            navigator.clipboard.writeText('');
            onCopy('');
        }, 30000);
    };

    return (
        <tr className="border-b border-[var(--border-light)] hover:bg-[var(--bg-page)] transition-colors group">
            <td className="py-3 px-4 font-mono text-sm text-[var(--text-primary)] font-medium break-all">{variable.key}</td>
            <td className="py-3 px-4 font-mono text-sm text-[var(--text-secondary)] break-all">
                {revealed ? variable.value : '•'.repeat(Math.min(20, variable.value?.length || 5))}
            </td>
            <td className="py-3 px-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setRevealed(!revealed)} className="p-1.5 hover:glass-tint rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                        {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={handleCopy} className="p-1.5 hover:glass-tint rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </td>
        </tr>
    );
}
