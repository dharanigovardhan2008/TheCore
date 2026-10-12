'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { X, Upload, FileCode, Info } from 'lucide-react'
import { parseEnv } from '@/lib/dotenv'
import { Project } from '@/lib/types'

interface EnvFileModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (projectId: string, fileName: string, label: string, content: string) => Promise<void>
  projects: Project[]
  initialProjectId?: string
}

export function EnvFileModal({ isOpen, onClose, onSave, projects, initialProjectId }: EnvFileModalProps) {
  const [projectId, setProjectId] = useState(initialProjectId || (projects.length > 0 ? projects[0].id : ''))
  const [fileNameMode, setFileNameMode] = useState<'.env' | '.env.local' | 'custom'>('.env')
  const [customFileName, setCustomFileName] = useState('')
  const [label, setLabel] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (initialProjectId) setProjectId(initialProjectId)
      else if (projects.length > 0) setProjectId(projects[0].id)
      setFileNameMode('.env')
      setCustomFileName('')
      setLabel('')
      setContent('')
      setError(null)
    }
  }, [isOpen, initialProjectId, projects])

  if (!isOpen) return null

  const getFinalFileName = () => {
    return fileNameMode === 'custom' ? customFileName : fileNameMode
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 100 * 1024) {
      setError('File size exceeds 100KB limit.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setContent(result)
        setError(null)
      }
    }
    reader.readAsText(file)
  }

  const validate = (): boolean => {
    setError(null)
    if (!projectId) {
      setError('Please select a project.')
      return false
    }
    const fn = getFinalFileName()
    if (!fn) {
      setError('File name is required.')
      return false
    }
    if (!/^[\w.\-]+$/.test(fn)) {
      setError('Invalid file name. Only alphanumeric, dots, and hyphens are allowed.')
      return false
    }
    if (content.length > 100 * 1024) {
      setError('Content exceeds 100KB limit.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setSaving(true)
    try {
      await onSave(projectId, getFinalFileName(), label, content)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const parsed = parseEnv(content)
  const varCount = parsed.filter(p => p.type === 'variable').length

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center justify-end bg-black/50 backdrop-blur-sm sm:p-4">
      <div className="glass w-full sm:w-[540px] rounded-t-[28px] sm:rounded-[20px] shadow-[var(--shadow-shell-soft)] flex flex-col overflow-hidden relative max-h-[90dvh] sm:max-h-[90vh] mt-auto sm:mt-0 pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <div className="w-9 h-1.5 bg-gray-300 rounded-full mx-auto my-3 sm:hidden" />
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="text-[17px] text-[var(--color-primary)] hover:opacity-80 transition-opacity"
            disabled={saving}
          >
            Cancel
          </button>
          <div className="font-semibold text-[var(--text-primary)] text-[17px]">
            Add Environment File
          </div>
          <button 
            type="button" 
            onClick={handleSubmit}
            className="text-[17px] font-semibold text-[var(--color-primary)] hover:opacity-80 disabled:opacity-50 transition-opacity"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-sm border border-amber-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{error.replace('PLAN_LIMIT_REACHED: ', '')}</p>
                {error.includes('PLAN_LIMIT_REACHED') && (
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                    Upgrade to TheCore Pro for unlimited .env files and projects.
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Project</label>
              <select 
                value={projectId} 
                onChange={e => setProjectId(e.target.value)}
                className="w-full p-3 bg-[var(--bg-page)] border border-[var(--border-color)] rounded-[var(--radius-btn)] outline-none focus:border-accent-primary transition-colors text-[var(--text-primary)]"
              >
                <option value="" disabled>Select a project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">File Name</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(['.env', '.env.local', 'custom'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFileNameMode(mode)}
                    className={`px-4 py-2 rounded-[var(--radius-btn)] text-sm font-semibold transition-colors ${
                      fileNameMode === mode
                        ? 'bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] text-white'
                        : 'bg-[var(--bg-page)] text-[var(--text-secondary)] hover:bg-gray-100'
                    }`}
                  >
                    {mode === 'custom' ? 'Custom' : mode}
                  </button>
                ))}
              </div>
              {fileNameMode === 'custom' && (
                <input
                  type="text"
                  placeholder="e.g. .env.production"
                  value={customFileName}
                  onChange={e => setCustomFileName(e.target.value)}
                  className="w-full p-3 bg-[var(--bg-page)] border border-[var(--border-color)] rounded-[var(--radius-btn)] outline-none focus:border-accent-primary transition-colors text-[var(--text-primary)]"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Label (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Production API Keys"
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="w-full p-3 bg-[var(--bg-page)] border border-[var(--border-color)] rounded-[var(--radius-btn)] outline-none focus:border-accent-primary transition-colors text-[var(--text-primary)]"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-[var(--text-primary)]">File Content</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-semibold hover:underline"
                >
                  <Upload className="w-4 h-4" />
                  Upload file instead
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  accept=".env,text/plain"
                  className="hidden"
                />
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="KEY=VALUE"
                className="w-full h-48 p-4 font-mono text-sm bg-[var(--bg-page)] border border-[var(--border-color)] rounded-[var(--radius-card)] outline-none focus:border-accent-primary transition-colors text-[var(--text-primary)] resize-none"
              />
              <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Info className="w-4 h-4" />
                <span>Found <strong>{varCount}</strong> variables</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
