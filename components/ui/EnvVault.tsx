'use client'

import React, { useEffect, useState } from 'react'
import { getEnvFiles } from '@/app/dashboard/vaultActions'
import { EnvFile } from '@/lib/types'
import { FileCode, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function EnvVault({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [envFiles, setEnvFiles] = useState<EnvFile[]>([])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const files = await getEnvFiles(projectId)
        setEnvFiles(files)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (loading) {
    return (
      <div className="glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-8 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)] mb-4" />
        <p className="text-[var(--text-secondary)] font-medium">Loading Environment Files...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-8">
        <p className="text-[var(--color-danger)] font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-8 flex flex-col h-full hover:shadow-[var(--shadow-card-hover)] transition-premium">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-xl flex items-center justify-center shadow-sm">
            <FileCode className="w-5 h-5 stroke-[2]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Environment Vault</h2>
        </div>
        <Link 
          href="/dashboard/env"
          className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] bg-[var(--bg-page)] hover:bg-[var(--color-primary-light)] px-4 py-2 rounded-full border border-[var(--border-light)] hover:border-[var(--color-primary)] transition-premium flex items-center justify-center sm:justify-start gap-2 text-[13px] font-bold shadow-sm w-full sm:w-auto"
        >
          Manage Vault
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      {envFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <p className="text-[var(--text-secondary)] font-medium mb-6">No secure environment files found for this project.</p>
          <Link
            href="/dashboard/env"
            className="bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 text-white px-6 py-2.5 rounded-full font-bold shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_8px_16px_rgba(79,70,229,0.4)] transition-premium active:scale-95"
          >
            Add .env File
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {envFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-tint)] rounded-xl border border-[var(--border-light)] transition-premium shadow-sm group">
              <div>
                <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-premium">{file.file_name}</h3>
                {file.label && (
                  <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">{file.label}</p>
                )}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-page)] px-3 py-1.5 rounded-md border border-[var(--border-light)] shadow-sm">
                Updated <span suppressHydrationWarning>{new Date(file.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
