'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ArrowLeft, ArrowRight, Check, Loader2, Building2, Settings2, Wand2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { databaseService } from '@/services/database'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import type { DisplayType } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Project name is required'),
  customerName: z.string().min(2, 'Customer name is required'),
  customerCompany: z.string().optional(),
  customerCountry: z.string().optional(),
  location: z.string().optional(),
  displayType: z.enum(['led_indoor', 'led_outdoor', 'lcd_video_wall', 'interactive']),
  targetWidthMm: z.coerce.number().positive('Enter a positive number'),
  targetHeightMm: z.coerce.number().positive('Enter a positive number'),
  aspectRatio: z.string().optional(),
  pixelPitchMm: z.coerce.number().optional(),
  viewingDistanceM: z.coerce.number().optional(),
  environment: z.enum(['indoor', 'outdoor', 'semi_outdoor']).optional(),
  brightnessNits: z.coerce.number().optional(),
  budgetUsd: z.coerce.number().optional(),
})
type FormValues = z.infer<typeof schema>

const STEPS = [
  { id: 1, label: 'Customer', description: 'Client & site information', icon: Building2 },
  { id: 2, label: 'Requirements', description: 'Display goals & environment', icon: Settings2 },
  { id: 3, label: 'Configuration', description: 'Engineering parameters', icon: Wand2 },
  { id: 4, label: 'Review', description: 'Confirm & create project', icon: Send },
]

export function ProjectWizard() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      customerName: '',
      customerCompany: '',
      customerCountry: '',
      location: '',
      displayType: 'led_indoor',
      targetWidthMm: 3840,
      targetHeightMm: 2160,
      aspectRatio: '16:9',
      pixelPitchMm: 2.5,
      viewingDistanceM: 4,
      environment: 'indoor',
      brightnessNits: 800,
      budgetUsd: undefined,
    },
  })

  const values = form.watch()

  const stepFields: Record<number, (keyof FormValues)[]> = {
    1: ['name', 'customerName', 'customerCompany', 'customerCountry', 'location'],
    2: ['displayType', 'environment', 'viewingDistanceM', 'brightnessNits'],
    3: ['targetWidthMm', 'targetHeightMm', 'aspectRatio', 'pixelPitchMm', 'budgetUsd'],
    4: [],
  }

  async function next() {
    const fields = stepFields[step]
    const ok = await form.trigger(fields)
    if (ok) setStep((s) => Math.min(4, s + 1))
  }
  function back() {
    setStep((s) => Math.max(1, s - 1))
  }

  async function onSubmit(v: FormValues) {
    if (!user) return
    setSubmitting(true)
    try {
      const project = await databaseService.createProject(
        {
          name: v.name,
          status: 'draft',
          customer: {
            name: v.customerName,
            company: v.customerCompany,
            country: v.customerCountry,
          },
          requirements: {
            displayType: v.displayType as DisplayType,
            targetWidthMm: v.targetWidthMm,
            targetHeightMm: v.targetHeightMm,
            aspectRatio: v.aspectRatio,
            pixelPitchMm: v.pixelPitchMm,
            viewingDistanceM: v.viewingDistanceM,
            environment: v.environment,
            brightnessNits: v.brightnessNits,
          },
          location: v.location,
          budgetUsd: v.budgetUsd,
        },
        user.id,
      )
      toast.success(`Project ${project.code} created`)
      router.push('/projects')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
      {/* Stepper */}
      <ol className="space-y-1">
        {STEPS.map((s) => {
          const active = s.id === step
          const complete = s.id < step
          const Icon = s.icon
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => complete && setStep(s.id)}
                disabled={!complete && !active}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  active
                    ? 'border-primary/40 bg-primary/5'
                    : complete
                    ? 'border-border bg-card hover:bg-muted'
                    : 'border-dashed border-border bg-card/40',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset',
                    active
                      ? 'bg-primary text-primary-foreground ring-primary'
                      : complete
                      ? 'bg-success text-success-foreground ring-success'
                      : 'bg-muted text-muted-foreground ring-border',
                  )}
                >
                  {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <p className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>
                    Step {s.id} · {s.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ol>

      {/* Panel */}
      <Card className="border-border shadow-elevation-1">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-heading-md text-foreground">Customer &amp; project</h2>
                  <p className="text-sm text-muted-foreground">Basic identification information for this engagement.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Project name" error={form.formState.errors.name?.message}>
                    <Input placeholder="Lobby video wall — Phase 2" {...form.register('name')} />
                  </Field>
                  <Field label="Site location">
                    <Input placeholder="City, Country" {...form.register('location')} />
                  </Field>
                  <Field label="Customer contact" error={form.formState.errors.customerName?.message}>
                    <Input placeholder="Primary contact name" {...form.register('customerName')} />
                  </Field>
                  <Field label="Company">
                    <Input placeholder="Legal entity or brand" {...form.register('customerCompany')} />
                  </Field>
                  <Field label="Country code">
                    <Input placeholder="e.g. AE, IN, DE, US" {...form.register('customerCountry')} />
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-heading-md text-foreground">Display requirements</h2>
                  <p className="text-sm text-muted-foreground">Define the display environment and viewing conditions.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Display type">
                    <Select
                      value={form.watch('displayType')}
                      onValueChange={(v) => form.setValue('displayType', v as DisplayType, { shouldValidate: true })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="led_indoor">LED — Indoor</SelectItem>
                        <SelectItem value="led_outdoor">LED — Outdoor</SelectItem>
                        <SelectItem value="lcd_video_wall">LCD Video Wall</SelectItem>
                        <SelectItem value="interactive">Interactive Display</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Environment">
                    <Select
                      value={form.watch('environment')}
                      onValueChange={(v) => form.setValue('environment', v as 'indoor' | 'outdoor' | 'semi_outdoor')}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="semi_outdoor">Semi-outdoor</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Viewing distance (m)">
                    <Input type="number" step="0.1" {...form.register('viewingDistanceM')} />
                  </Field>
                  <Field label="Brightness (nits)">
                    <Input type="number" step="50" {...form.register('brightnessNits')} />
                  </Field>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-heading-md text-foreground">Engineering parameters</h2>
                  <p className="text-sm text-muted-foreground">Set the physical dimensions and target pixel pitch.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Target width (mm)" error={form.formState.errors.targetWidthMm?.message}>
                    <Input type="number" {...form.register('targetWidthMm')} />
                  </Field>
                  <Field label="Target height (mm)" error={form.formState.errors.targetHeightMm?.message}>
                    <Input type="number" {...form.register('targetHeightMm')} />
                  </Field>
                  <Field label="Aspect ratio">
                    <Input placeholder="16:9" {...form.register('aspectRatio')} />
                  </Field>
                  <Field label="Pixel pitch (mm)">
                    <Input type="number" step="0.1" {...form.register('pixelPitchMm')} />
                  </Field>
                  <Field label="Budget (USD)">
                    <Input type="number" placeholder="Optional" {...form.register('budgetUsd')} />
                  </Field>
                </div>
                <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Engineering calculations (cabinet layout, power, weight, BOQ) will run automatically after project creation in a subsequent release.
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-heading-md text-foreground">Review &amp; create</h2>
                  <p className="text-sm text-muted-foreground">Confirm the details below — you can edit later.</p>
                </div>
                <dl className="divide-y divide-border rounded-lg border border-border bg-muted/20">
                  {[
                    ['Project', values.name || '—'],
                    ['Customer', values.customerName + (values.customerCompany ? ` · ${values.customerCompany}` : '')],
                    ['Location', values.location || '—'],
                    ['Display', `${values.displayType.replace(/_/g, ' ')} · ${values.environment}`],
                    ['Dimensions', `${values.targetWidthMm} × ${values.targetHeightMm} mm · ${values.aspectRatio}`],
                    ['Pixel pitch', values.pixelPitchMm ? `P${values.pixelPitchMm}` : '—'],
                    ['Viewing distance', values.viewingDistanceM ? `${values.viewingDistanceM} m` : '—'],
                    ['Brightness', values.brightnessNits ? `${values.brightnessNits} nits` : '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="col-span-2 font-medium text-foreground">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-6">
              <Button type="button" variant="ghost" onClick={back} disabled={step === 1}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
              </Button>
              {step < 4 ? (
                <Button type="button" onClick={next}>
                  Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create project
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  children,
  error,
}: {
  label: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
