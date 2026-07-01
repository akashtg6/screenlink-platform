'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid work email'),
  organization: z.string().min(2, 'Organization is required'),
  password: z.string().min(8, 'Use at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

export function SignupForm() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', organization: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await signUp(values)
      toast.success('Workspace created — welcome to ScreenLink.ai')
      router.push('/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create workspace')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" placeholder="Jane Engineer" {...form.register('name')} />
        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" type="email" placeholder="jane@company.com" {...form.register('email')} />
        {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="organization">Organization</Label>
        <Input id="organization" placeholder="Company or firm" {...form.register('organization')} />
        {form.formState.errors.organization && (
          <p className="text-xs text-destructive">{form.formState.errors.organization.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="••••••••" {...form.register('password')} />
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
  )
}
