'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { verifyPassword, generateVerifier, VaultVerifier } from '@/lib/crypto'
import { setupVaultVerifier } from '@/app/dashboard/vaultActions'

interface VaultContextType {
  masterPassword: string | null
  hasVerifier: boolean
  isLocked: boolean
  setHasVerifier: (has: boolean) => void
  unlock: (password: string, verifier: VaultVerifier) => Promise<boolean>
  setup: (password: string) => Promise<void>
  lock: () => void
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes

export function VaultProvider({ children }: { children: ReactNode }) {
  const [masterPassword, setMasterPassword] = useState<string | null>(null)
  const [hasVerifier, setHasVerifier] = useState<boolean>(false)
  const isLocked = masterPassword === null

  const lock = useCallback(() => {
    setMasterPassword(null)
  }, [])

  // Auto-lock timer
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timeoutId)
      if (masterPassword !== null) {
        timeoutId = setTimeout(() => {
          lock()
        }, INACTIVITY_TIMEOUT)
      }
    }

    if (masterPassword !== null) {
      resetTimer()
      window.addEventListener('mousemove', resetTimer)
      window.addEventListener('keydown', resetTimer)
    }

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
    }
  }, [masterPassword, lock])

  const unlock = async (password: string, verifier: VaultVerifier) => {
    const isValid = await verifyPassword(password, verifier)
    if (isValid) {
      setMasterPassword(password)
      return true
    }
    return false
  }

  const setup = async (password: string) => {
    const verifier = await generateVerifier(password)
    await setupVaultVerifier(verifier)
    setHasVerifier(true)
    setMasterPassword(password)
  }

  return (
    <VaultContext.Provider
      value={{
        masterPassword,
        hasVerifier,
        isLocked,
        setHasVerifier,
        unlock,
        setup,
        lock
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const context = useContext(VaultContext)
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider')
  }
  return context
}
