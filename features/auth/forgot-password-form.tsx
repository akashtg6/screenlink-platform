'use client'

import { useState } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormValues = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const { sendPasswordReset } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await sendPasswordReset(values.email)
      setSentTo(values.email)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not send reset email'
      if (msg.includes('SUPABASE_NOT_CONFIGURED')) {
        toast.error('Supabase is not configured yet.', {
          description: 'Add your Supabase keys to .env to enable password reset.',
        })
      } else {
        toast.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-heading-md text-foreground">Check your inbox</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, you’ll receive an email with a link to reset your password.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" type="email" placeholder="jane@company.com" autoComplete="email" {...form.register('email')} />
        {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
      </div>

      <Button type="submit" className="h-10 w-full" disabled={submitting}>
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send reset link
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Remembered it? <Link href="/login" className="font-medium text-accent hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
