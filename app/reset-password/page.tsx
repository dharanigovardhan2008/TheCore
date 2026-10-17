'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Brand from '@/components/ui/Brand'

const field = 'w-full min-h-11 rounded-[var(--radius-btn)] border border-[var(--border-light)] bg-surface-tint px-4 py-3 text-base text-content outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
const lbl = 'mb-1 mt-4 block text-sm font-medium text-content'

export default function NewPassword() {
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // This page is only reachable after the code was verified (a session exists).
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/forgot-password')
      else setReady(true)
    })
  }, [router, supabase])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    if (password !== confirm) return setError('The passwords do not match.')
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) return setError(err.message)
    router.replace('/dashboard')
    router.refresh()
  }

  if (!ready) return null
  return (
    <div className="gradient-bg flex min-h-[100dvh] items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-[var(--radius-shell)] bg-surface p-6 shadow-[var(--shadow-shell-soft)] sm:p-8">
        <div className="mb-4 flex justify-center"><Brand size="lg" /></div>
        <h1 className="text-center text-2xl font-bold text-content">Choose a new password</h1>
        <p className="mt-2 text-center text-sm text-content-secondary">Your code was verified. Set a new password to finish.</p>
        <label htmlFor="pw" className={lbl}>New password</label>
        <input id="pw" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        <label htmlFor="cf" className={lbl}>Confirm new password</label>
        <input id="cf" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="mt-6 min-h-11 w-full rounded-full bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{loading ? 'Updating…' : 'Update password'}</button>
      </form>
    </div>
  )
}