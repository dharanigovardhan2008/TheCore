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
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Accounts & Logins</h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-1">All your platform logins organized by email address.</p>
      </div>

      {grouped.map((group) => (
        <section key={group.email} className="glass rounded-[var(--radius-panel)] shadow-[var(--shadow-soft)] p-4 sm:p-6 lg:p-8 hover:shadow-[var(--shadow-card-hover)] transition-premium">
          <div className="mb-4 sm:mb-6 flex items-center gap-3 border-b border-[var(--border-light)] pb-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-tint)] flex items-center justify-center text-[var(--color-primary)] shadow-xs shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate min-w-0 flex-1" title={group.email}>
              {group.email}
            </h2>
            <span className="shrink-0 text-xs font-bold bg-[var(--bg-surface-tint)] text-[var(--text-secondary)] px-2.5 py-1 rounded-full shadow-xs border border-[var(--border-light)] whitespace-nowrap">
              {group.services.length} {group.services.length === 1 ? 'account' : 'accounts'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {group.services.map((service) => (
              <div 
                key={service.id} 
                className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-[var(--bg-page)] rounded-2xl border border-[var(--border-light)] hover:border-[var(--color-primary)] transition-premium group shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <PlatformLogo tech={service.platform} className="!w-10 !h-10 !rounded-xl shadow-xs border border-[var(--border-light)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-tight truncate">{service.platform}</p>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] capitalize mt-0.5 truncate">{service.kind} Service</p>
                  </div>
                </div>

                {service.project && (
                  <Link 
                    href={`/dashboard/${service.project.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:border-[var(--color-primary)] transition-premium shadow-xs shrink-0"
                    title={`View ${service.project.name}`}
                  >
                    <span className="text-xs font-semibold max-w-[100px] sm:max-w-[140px] truncate">
                      {service.project.name}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
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
