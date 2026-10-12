'use client'

import React, { useMemo } from 'react'
import { Project, Service } from '@/lib/types'
import { Mail, ExternalLink, Key } from 'lucide-react'
import Link from 'next/link'
import PlatformLogo from '@/components/ui/PlatformLogo'

interface AccountsClientProps {
  projects: Project[]
  services: Service[]
}

interface GroupedAccount {
  email: string
  services: (Service & { project: Project | undefined })[]
}

export default function AccountsClient({ projects, services }: AccountsClientProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, GroupedAccount>()

    services.forEach(service => {
      const email = service.login_email?.trim() || 'No Email Provided'
      if (!map.has(email)) {
        map.set(email, { email, services: [] })
      }
      
      const project = projects.find(p => p.id === service.project_id)
      
      map.get(email)!.services.push({ ...service, project })
    })

    const array = Array.from(map.values())
    array.sort((a, b) => {
      if (a.email === 'No Email Provided') return 1
      if (b.email === 'No Email Provided') return -1
      return a.email.localeCompare(b.email)
    })

    return array
  }, [projects, services])

  if (grouped.length === 0) {
    return (
      <div className="bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card-soft)] p-12 text-center">
        <Key className="mx-auto h-12 w-12 text-content-hint mb-4" />
        <h3 className="text-lg font-medium text-content mb-2">No accounts found</h3>
        <p className="text-content-secondary">Add some services to your projects to see them here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Accounts & Logins</h1>
        <p className="text-[var(--text-secondary)] mt-2">All your platform logins organized by email address.</p>
      </div>

      {grouped.map((group) => (
        <section key={group.email} className="glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-6 sm:p-8 hover:shadow-[var(--shadow-card-hover)] transition-premium">
          <div className="mb-6 flex items-center gap-3 border-b border-[var(--border-light)] pb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-tint)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{group.email}</h2>
            <span className="ml-auto text-xs font-bold bg-[var(--bg-surface-tint)] text-[var(--text-secondary)] px-3 py-1 rounded-full shadow-sm border border-[var(--border-light)]">
              {group.services.length} {group.services.length === 1 ? 'account' : 'accounts'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.services.map((service) => (
              <div 
                key={service.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[var(--bg-page)] rounded-[var(--radius-card)] border border-[var(--border-light)] hover:border-[var(--color-primary)] transition-premium group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <PlatformLogo tech={service.platform} className="!w-12 !h-12 !rounded-xl shadow-sm border border-[var(--border-light)]" />
                  <div>
                    <p className="font-bold text-[16px] text-[var(--text-primary)] leading-tight">{service.platform}</p>
                    <p className="text-[12px] font-medium text-[var(--text-tertiary)] capitalize mt-1 tracking-wide">{service.kind} Service</p>
                  </div>
                </div>

                {service.project && (
                  <Link 
                    href={`/dashboard/projects/${service.project.id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 sm:p-0 sm:w-10 sm:h-10 sm:justify-center rounded-lg sm:rounded-full bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-tertiary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:border-[var(--color-primary)] transition-premium shadow-sm group-hover:scale-105"
                    title={`View ${service.project.name}`}
                  >
                    <span className="sm:hidden text-xs font-semibold text-[var(--text-secondary)] group-hover:text-[var(--color-primary)]">
                      {service.project.name}
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
