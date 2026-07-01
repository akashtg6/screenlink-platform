'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Chrome, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface Props {
  redirect?: string
  label?: string
  disabled?: boolean
}

export function GoogleSignInButton({ redirect = '/dashboard', label = 'Continue with Google', disabled }: Props) {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await signInWithGoogle(redirect)
      // Supabase redirects the browser; nothing else to do.
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed'
      if (msg.includes('SUPABASE_NOT_CONFIGURED')) {
        toast.error('Supabase is not configured yet', {
          description: 'Add your Supabase keys to .env to enable authentication.',
        })
      } else if (msg.toLowerCase().includes('provider is not enabled')) {
        toast.error('Google provider is not enabled', {
          description: 'Enable it in Supabase Dashboard → Authentication → Providers → Google.',
        })
      } else {
        toast.error(msg)
      }
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-full gap-2"
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
      {label}
    </Button>
  )
}
