'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { GoogleSignInButton } from './google-sign-in-button'
import { toast } from 'sonner'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid work email'),
  organizationName: z.string().min(2, 'Organization is required'),
  password: z.string().min(8, 'Use at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

export function SignupForm() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [awaitingEmail, setAwaitingEmail] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', organizationName: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const session = await signUp(values)
      if (session) {
        toast.success('Workspace created — welcome to ScreenLink.ai')
        router.push('/dashboard')
      } else {
        setAwaitingEmail(values.email)
        toast.info('Check your email to confirm your account.')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create workspace'
      if (msg.toLowerCase().includes('user already registered')) {
        toast.error('An account with this email already exists.', {
          description: 'Try signing in instead, or use forgot password.',
        })
      } else if (msg.includes('SUPABASE_NOT_CONFIGURED')) {
        toast.error('Supabase is not configured yet.', {
          description: 'Add your Supabase URL and anon key to .env to enable signup.',
        })
      } else {
        toast.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (awaitingEmail) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-heading-md text-foreground">Confirm your email</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We sent a confirmation link to <span className="font-medium text-foreground">{awaitingEmail}</span>.
            Click the link to activate your ScreenLink workspace.
          </p>
        </div>
        <Button variant="outline" onClick={() => setAwaitingEmail(null)} className="w-full">
          Back to sign up
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GoogleSignInButton label="Sign up with Google" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or with email</span>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" placeholder="Jane Engineer" {...form.register('fullName')} />
          {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="jane@company.com" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="organizationName">Organization</Label>
          <Input id="organizationName" placeholder="Company or firm" {...form.register('organizationName')} />
          {form.formState.errors.organizationName && (
            <p className="text-xs text-destructive">{form.formState.errors.organizationName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" {...form.register('password')} />
          {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
        </div>

        <Button type="submit" className="h-10 w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create workspace
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Already using ScreenLink? <Link href="/login" className="font-medium text-accent hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
