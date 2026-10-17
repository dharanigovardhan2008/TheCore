'use client'
import { Suspense, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Brand from '@/components/ui/Brand'

const field = 'w-full min-h-11 rounded-[var(--radius-btn)] border border-[var(--border-light)] bg-surface-tint px-4 py-3 text-base text-content outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
const lbl = 'mb-1 mt-4 block text-sm font-medium text-content'

function Form() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(30)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' })
    setLoading(false)
    if (err) return setError('That code is invalid or has expired. Request a new one.')
    router.replace('/reset-password/new')
  }

  async function resend() {
    setCooldown(30)
    await supabase.auth.resetPasswordForEmail(email.trim())
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-[var(--radius-shell)] bg-surface p-6 shadow-[var(--shadow-shell-soft)] sm:p-8">
      <div className="mb-4 flex justify-center"><Brand size="lg" /></div>
      <h1 className="text-center text-2xl font-bold text-content">Enter your code</h1>
      <p className="mt-2 text-center text-sm text-content-secondary">If an account exists for this email, we sent a 6-digit code.</p>
      <label htmlFor="email" className={lbl}>Email</label>
      <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      <label htmlFor="code" className={lbl}>6-digit code</label>
      <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={`${field} text-center text-xl tracking-[0.5em]`} />
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <button disabled={loading || code.length !== 6} className="mt-6 min-h-11 w-full rounded-full bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{loading ? 'Verifying…' : 'Verify code'}</button>
      <button type="button" onClick={resend} disabled={cooldown > 0} className="mt-3 min-h-11 w-full text-sm font-medium text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline">
        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
      </button>
      <Link href="/login" className="block text-center text-sm text-content-secondary hover:underline">Back to sign in</Link>
    </form>
  )
}

export default function ResetPassword() {
  return (
    <div className="gradient-bg flex min-h-[100dvh] items-center justify-center p-4">
      <Suspense fallback={null}><Form /></Suspense>
    </div>
  )
}