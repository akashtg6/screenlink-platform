'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/use-auth'
import { GoogleSignInButton } from './google-sign-in-button'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(6, 'At least 6 characters'),
  remember: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Invalid email or password.'
  if (lower.includes('email not confirmed')) return 'Please confirm your email address before signing in.'
  if (lower.includes('supabase_not_configured')) return 'Supabase is not configured yet. Add your keys to .env.'
  if (lower.includes('failed to fetch') || lower.includes('network')) return 'Network error — check your connection and try again.'
  return msg
}

export function LoginForm() {
  const { signIn } = useAuth()
  const router = useRouter()
  const search = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const urlError = search?.get('error')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: true },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await signIn({ email: values.email, password: values.password, remember: values.remember })
      toast.success('Welcome back to ScreenLink.ai')
      const next = search?.get('next') || '/dashboard'
      router.push(next)
    } catch (e) {
      const msg = friendlyError(e instanceof Error ? e.message : 'Sign-in failed')
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {urlError && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{friendlyError(decodeURIComponent(urlError))}</span>
        </div>
      )}

      <GoogleSignInButton redirect={search?.get('next') || '/dashboard'} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="jane@company.com" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-accent hover:underline">Forgot?</Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...form.register('password')} />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            defaultChecked
            onCheckedChange={(v) => form.setValue('remember', Boolean(v))}
          />
          <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground">
            Keep me signed in on this device
          </Label>
        </div>

        <Button type="submit" className="h-10 w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in to ScreenLink
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          By continuing you agree to the <Link href="#" className="underline">Terms</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  )
}
