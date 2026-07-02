'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Settings2, Monitor, Eye, Zap, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useProjectRepository } from '@/hooks/use-project-repository'
import { useAutosave } from '@/hooks/use-autosave'
import { useUnsavedWarning } from '@/hooks/use-unsaved-warning'
import {
  projectWizardSchema, WIZARD_DEFAULTS, computeProgress, valuesToProjectPatch,
  projectToValues, type ProjectWizardValues,
} from '@/lib/validation/project-schemas'
import type { Project } from '@/types'
import { ProgressIndicator, type WizardStepDef } from './progress-indicator'
import { WizardNavigation } from './wizard-navigation'
import { AutosaveIndicator } from './autosave-indicator'
import { EngineeringSummaryPanel } from './engineering-summary-panel'

const STEPS: WizardStepDef[] = [
  { id: 1, label: 'Information',  description: 'Project & customer',       icon: Building2 },
  { id: 2, label: 'Installation', description: 'Type, mounting, access',   icon: Settings2 },
  { id: 3, label: 'Display',      description: 'Dimensions & resolution',  icon: Monitor },
  { id: 4, label: 'Viewing',      description: 'Distance & environment',   icon: Eye },
  { id: 5, label: 'Electrical',   description: 'Power & connectivity',     icon: Zap },
  { id: 6, label: 'Review',       description: 'Confirm & submit',         icon: Send },
]

const STEP_FIELDS: Record<number, (keyof ProjectWizardValues)[]> = {
  1: ['name','customerName','country','city','application','description','priority','targetCompletionDate','code','consultant','integrator'],
  2: ['installationTypes','mountingType','maintenanceAccess'],
  3: ['screenWidth','screenHeight','measurementUnit','pixelPitchPreference','cabinetSize','preferredResolution','orientation','displayQuantity'],
  4: ['nearestDistanceM','farthestDistanceM','viewingHeightM','viewingAngle','contentType','ambientLight','directSunlight','operationHoursPerDay'],
  5: ['voltage','availablePowerKw','ups','generator','internet','remoteMonitoring'],
  6: [],
}

export function ProjectWizard({ initialProject }: { initialProject?: Project }) {
  const router = useRouter()
  const repo = useProjectRepository()
  const [step, setStep] = useState(1)
  const [projectId, setProjectId] = useState<string | null>(initialProject?.id ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  const methods = useForm<ProjectWizardValues>({
    resolver: zodResolver(projectWizardSchema),
    mode: 'onBlur',
    defaultValues: initialProject ? projectToValues(initialProject) : WIZARD_DEFAULTS,
  })

  const values = methods.watch()
  const progressPercent = useMemo(() => computeProgress(values), [values])

  const persist = useCallback(async (v: ProjectWizardValues, opts: { silent?: boolean } = {}) => {
    if (!repo) return
    const patch = valuesToProjectPatch(v)
    if (projectId) {
      await repo.update(projectId, { ...patch, progressPercent })
    } else if (v.name && v.customerName) {
      // Auto-create the draft the first time enough info exists.
      const created = await repo.create({ ...patch, status: 'draft', progressPercent })
      setProjectId(created.id)
      if (!opts.silent) toast.success(`Draft ${created.code} created`)
    }
  }, [repo, projectId, progressPercent])

  const autosave = useAutosave({
    value: values,
    save: async (v) => persist(v, { silent: true }),
    enabled: Boolean(repo) && (Boolean(projectId) || (Boolean(values.name) && Boolean(values.customerName))),
  })

  useUnsavedWarning(autosave.dirty())

  async function goNext() {
    const fields = STEP_FIELDS[step]
    const ok = await methods.trigger(fields as never)
    if (!ok) { toast.error('Please fix the highlighted fields'); return }
    await autosave.flush()
    setStep((s) => Math.min(6, s + 1))
  }
  function goBack() { setStep((s) => Math.max(1, s - 1)) }
  function goTo(n: number) { if (n < step) setStep(n) }

  async function saveDraft() {
    setSavingDraft(true)
    try {
      await persist(values)
      toast.success('Draft saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally { setSavingDraft(false) }
  }

  async function submit() {
    const ok = await methods.trigger()
    if (!ok) { toast.error('Some required fields are missing.'); return }
    if (!repo) return
    setSubmitting(true)
    try {
      await persist(values)
      if (projectId) await repo.submit(projectId)
      toast.success('Project submitted for review')
      router.push(projectId ? `/projects/${projectId}` : '/projects')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submit failed')
    } finally { setSubmitting(false) }
  }

  return (
    <FormProvider {...methods}>
      <div className="grid gap-6 lg:grid-cols-[260px,minmax(0,1fr),340px]">
        <div className="space-y-4">
          <ProgressIndicator steps={STEPS} current={step} progressPercent={progressPercent} onSelect={goTo} />
          <div className="rounded-lg border border-border bg-card p-3">
            <AutosaveIndicator status={autosave.status} lastSavedAt={autosave.lastSavedAt} />
            {projectId && <p className="mt-1 font-mono text-[10px] text-muted-foreground">Draft id: {projectId.slice(0, 8)}…</p>}
          </div>
        </div>
        <Card className="border-border shadow-elevation-1">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {step === 1 && <StepInformation />}
              {step === 2 && <StepInstallation />}
              {step === 3 && <StepDisplay />}
              {step === 4 && <StepViewing />}
              {step === 5 && <StepElectrical />}
              {step === 6 && <StepReview goToStep={setStep} />}
              <WizardNavigation step={step} totalSteps={STEPS.length} onBack={goBack} onNext={goNext} onSaveDraft={saveDraft} onSubmit={submit} submitting={submitting} savingDraft={savingDraft} />
            </form>
          </CardContent>
        </Card>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <EngineeringSummaryPanel values={values} />
        </aside>
      </div>
    </FormProvider>
  )
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-heading-md text-foreground">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>
}
function Field({ label, error, children, span }: { label: string; error?: string; children: React.ReactNode; span?: 1 | 2 }) {
  return (<div className={cn('space-y-1.5', span === 2 && 'md:col-span-2')}><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>)
}

function StepInformation() {
  const { register, formState: { errors }, control } = useFormContext<ProjectWizardValues>()
  return (
    <div className="space-y-5">
      <StepHeader title="Project information" description="Identify the customer and describe the engagement." />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Project name *" error={errors.name?.message}><Input placeholder="Lobby video wall — Phase 2" {...register('name')} /></Field>
        <Field label="Project code"><Input placeholder="Auto-generated if empty" {...register('code')} /></Field>
        <Field label="Customer name *" error={errors.customerName?.message}><Input placeholder="Primary contact" {...register('customerName')} /></Field>
        <Field label="Consultant"><Input {...register('consultant')} /></Field>
        <Field label="Integrator"><Input {...register('integrator')} /></Field>
        <Field label="Application">
          <Controller name="application" control={control} render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Select application" /></SelectTrigger><SelectContent>
              {['corporate','retail','transport','stadium','broadcast','control_room','hospitality','education','other'].map((v) => (<SelectItem key={v} value={v} className="capitalize">{v.replace(/_/g, ' ')}</SelectItem>))}
            </SelectContent></Select>)} />
        </Field>
        <Field label="Country"><Input placeholder="e.g. AE, IN, DE, US" {...register('country')} /></Field>
        <Field label="City"><Input {...register('city')} /></Field>
        <Field label="Priority">
          <Controller name="priority" control={control} render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger><SelectContent>
              <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem>
            </SelectContent></Select>)} />
        </Field>
        <Field label="Target completion date"><Input type="date" {...register('targetCompletionDate')} /></Field>
        <Field label="Description" span={2}><Textarea rows={3} placeholder="Short summary of the engagement…" {...register('description')} /></Field>
      </div>
    </div>
  )
}

function StepInstallation() {
  const { control, formState: { errors } } = useFormContext<ProjectWizardValues>()
  const types = [{v:'indoor',l:'Indoor'},{v:'outdoor',l:'Outdoor'},{v:'rental',l:'Rental'},{v:'transparent',l:'Transparent'},{v:'interactive',l:'Interactive'},{v:'creative',l:'Creative'},{v:'lcd_video_wall',l:'LCD Video Wall'},{v:'led',l:'LED'},{v:'custom',l:'Custom'}]
  return (
    <div className="space-y-5">
      <StepHeader title="Installation" description="Choose one or more installation types and mounting configuration." />
      <Field label="Installation types *" error={errors.installationTypes?.message as string}>
        <Controller name="installationTypes" control={control} render={({ field }) => (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {types.map((t) => {
              const checked = field.value?.includes(t.v as never) ?? false
              return (
                <label key={t.v} className={cn('flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm transition-colors', checked ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted')}>
                  <Checkbox checked={checked} onCheckedChange={(c) => {
                    const arr = field.value || []
                    field.onChange(c ? [...arr, t.v] : arr.filter((x: string) => x !== t.v))
                  }} />
                  <span>{t.l}</span>
                </label>)
            })}
          </div>)} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Mounting type">
          <Controller name="mountingType" control={control} render={({ field }) => (
            <RadioGroup value={field.value ?? ''} onValueChange={field.onChange} className="grid grid-cols-3 gap-2">
              {['wall','pole','floor','hanging','ceiling'].map((m) => (
                <label key={m} className={cn('flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm capitalize', field.value === m ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted')}><RadioGroupItem value={m} />{m}</label>))}
            </RadioGroup>)} />
        </Field>
        <Field label="Maintenance access">
          <Controller name="maintenanceAccess" control={control} render={({ field }) => (
            <RadioGroup value={field.value ?? ''} onValueChange={field.onChange} className="grid grid-cols-3 gap-2">
              {['front','rear','both'].map((m) => (
                <label key={m} className={cn('flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm capitalize', field.value === m ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted')}><RadioGroupItem value={m} />{m}</label>))}
            </RadioGroup>)} />
        </Field>
      </div>
    </div>
  )
}

function StepDisplay() {
  const { register, control, formState: { errors } } = useFormContext<ProjectWizardValues>()
  return (
    <div className="space-y-5">
      <StepHeader title="Display" description="Physical dimensions, resolution and orientation." />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Screen width" error={errors.screenWidth?.message}><Input type="number" step="any" {...register('screenWidth')} /></Field>
        <Field label="Screen height" error={errors.screenHeight?.message}><Input type="number" step="any" {...register('screenHeight')} /></Field>
        <Field label="Measurement unit">
          <Controller name="measurementUnit" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="mm">mm</SelectItem><SelectItem value="cm">cm</SelectItem><SelectItem value="m">m</SelectItem><SelectItem value="inch">inch</SelectItem>
            </SelectContent></Select>)} />
        </Field>
        <Field label="Pixel pitch (mm)"><Input type="number" step="0.1" {...register('pixelPitchPreference')} /></Field>
        <Field label="Cabinet size"><Input placeholder="e.g. 500×500 mm" {...register('cabinetSize')} /></Field>
        <Field label="Preferred resolution"><Input placeholder="e.g. 3840×2160" {...register('preferredResolution')} /></Field>
        <Field label="Orientation">
          <Controller name="orientation" control={control} render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Select orientation" /></SelectTrigger><SelectContent>
              <SelectItem value="landscape">Landscape</SelectItem><SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="curved">Curved</SelectItem><SelectItem value="corner">Corner</SelectItem><SelectItem value="custom_shape">Custom shape</SelectItem>
            </SelectContent></Select>)} />
        </Field>
        <Field label="Display quantity"><Input type="number" {...register('displayQuantity')} /></Field>
      </div>
    </div>
  )
}

function StepViewing() {
  const { register, control } = useFormContext<ProjectWizardValues>()
  return (
    <div className="space-y-5">
      <StepHeader title="Viewing" description="How and where audiences will consume the display." />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nearest viewing distance (m)"><Input type="number" step="0.1" {...register('nearestDistanceM')} /></Field>
        <Field label="Farthest viewing distance (m)"><Input type="number" step="0.1" {...register('farthestDistanceM')} /></Field>
        <Field label="Viewing height (m)"><Input type="number" step="0.1" {...register('viewingHeightM')} /></Field>
        <Field label="Viewing angle (°)"><Input type="number" {...register('viewingAngle')} /></Field>
        <Field label="Content type">
          <Controller name="contentType" control={control} render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Select content type" /></SelectTrigger><SelectContent>
              {['powerpoint','video','broadcast','control_room','dashboard','advertising','gaming','mixed'].map((v) => (<SelectItem key={v} value={v} className="capitalize">{v.replace(/_/g, ' ')}</SelectItem>))}
            </SelectContent></Select>)} />
        </Field>
        <Field label="Ambient light">
          <Controller name="ambientLight" control={control} render={({ field }) => (
            <RadioGroup value={field.value ?? ''} onValueChange={field.onChange} className="grid grid-cols-3 gap-2">
              {['low','medium','high'].map((m) => (
                <label key={m} className={cn('flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm capitalize', field.value === m ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted')}><RadioGroupItem value={m} />{m}</label>))}
            </RadioGroup>)} />
        </Field>
        <Field label="Direct sunlight">
          <Controller name="directSunlight" control={control} render={({ field }) => (
            <div className="flex items-center gap-3 rounded-md border border-border p-3"><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} /><span className="text-sm text-muted-foreground">{field.value ? 'Yes' : 'No'}</span></div>)} />
        </Field>
        <Field label="Operation hours / day"><Input type="number" {...register('operationHoursPerDay')} /></Field>
      </div>
    </div>
  )
}

function StepElectrical() {
  const { register, control } = useFormContext<ProjectWizardValues>()
  return (
    <div className="space-y-5">
      <StepHeader title="Electrical & connectivity" description="Power source, backup, and network infrastructure." />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Voltage"><Input placeholder="e.g. 220V / 50Hz" {...register('voltage')} /></Field>
        <Field label="Available power (kW)"><Input type="number" step="0.1" {...register('availablePowerKw')} /></Field>
        <Field label="UPS">
          <Controller name="ups" control={control} render={({ field }) => (
            <div className="flex items-center gap-3 rounded-md border border-border p-3"><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} /><span className="text-sm text-muted-foreground">{field.value ? 'Yes' : 'No'}</span></div>)} />
        </Field>
        <Field label="Generator">
          <Controller name="generator" control={control} render={({ field }) => (
            <div className="flex items-center gap-3 rounded-md border border-border p-3"><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} /><span className="text-sm text-muted-foreground">{field.value ? 'Yes' : 'No'}</span></div>)} />
        </Field>
        <Field label="Internet" span={2}>
          <Controller name="internet" control={control} render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {[{v:'lan',l:'LAN'},{v:'wifi',l:'Wi-Fi'},{v:'fiber',l:'Fiber'}].map((t) => {
                const checked = field.value?.includes(t.v as never) ?? false
                return (<label key={t.v} className={cn('flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm', checked ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted')}><Checkbox checked={checked} onCheckedChange={(c) => { const arr = field.value || []; field.onChange(c ? [...arr, t.v] : arr.filter((x: string) => x !== t.v)) }} />{t.l}</label>)
              })}
            </div>)} />
        </Field>
        <Field label="Remote monitoring">
          <Controller name="remoteMonitoring" control={control} render={({ field }) => (
            <div className="flex items-center gap-3 rounded-md border border-border p-3"><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} /><span className="text-sm text-muted-foreground">{field.value ? 'Required' : 'Not required'}</span></div>)} />
        </Field>
      </div>
    </div>
  )
}

function StepReview({ goToStep }: { goToStep: (n: number) => void }) {
  const { getValues, formState: { errors, isValid } } = useFormContext<ProjectWizardValues>()
  const v = getValues()
  const percent = computeProgress(v)
  const section = (n: number, title: string, rows: [string, string][]) => (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        <button type="button" onClick={() => goToStep(n)} className="text-xs font-medium text-accent hover:underline">Edit</button>
      </div>
      <dl className="divide-y divide-border">
        {rows.map(([k, val]) => (<div key={k} className="grid grid-cols-3 gap-4 px-4 py-2.5 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="col-span-2 font-medium text-foreground">{val || '—'}</dd></div>))}
      </dl>
    </div>)
  return (
    <div className="space-y-5">
      <StepHeader title="Review & submit" description="Verify each section. Fields you skipped can still be edited later." />
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-semibold text-foreground">{percent}%</span>
          <span className="text-muted-foreground">completion</span>
        </div>
        {!isValid && Object.keys(errors).length > 0 && (
          <span className="text-xs text-warning">Some optional fields have validation issues.</span>
        )}
      </div>
      {section(1, 'Information', [['Name', v.name], ['Code', v.code || 'auto'], ['Customer', v.customerName], ['Consultant', v.consultant || ''], ['Integrator', v.integrator || ''], ['Location', [v.city, v.country].filter(Boolean).join(', ')], ['Application', String(v.application || '').replace(/_/g, ' ')], ['Priority', v.priority || ''], ['Target date', v.targetCompletionDate || '']])}
      {section(2, 'Installation', [['Types', (v.installationTypes || []).join(', ').replace(/_/g, ' ')], ['Mounting', v.mountingType || ''], ['Maintenance', v.maintenanceAccess || '']])}
      {section(3, 'Display', [['Dimensions', v.screenWidth && v.screenHeight ? `${v.screenWidth} × ${v.screenHeight} ${v.measurementUnit}` : ''], ['Pixel pitch', v.pixelPitchPreference ? `${v.pixelPitchPreference} mm` : ''], ['Resolution', v.preferredResolution || ''], ['Orientation', v.orientation || ''], ['Quantity', v.displayQuantity ? String(v.displayQuantity) : '']])}
      {section(4, 'Viewing', [['Distance', v.nearestDistanceM || v.farthestDistanceM ? `${v.nearestDistanceM ?? '?'}–${v.farthestDistanceM ?? '?'} m` : ''], ['Content', v.contentType || ''], ['Ambient light', v.ambientLight || ''], ['Direct sun', v.directSunlight ? 'Yes' : 'No'], ['Ops hrs/day', v.operationHoursPerDay ? String(v.operationHoursPerDay) : '']])}
      {section(5, 'Electrical', [['Voltage', v.voltage || ''], ['Available power', v.availablePowerKw ? `${v.availablePowerKw} kW` : ''], ['UPS', v.ups ? 'Yes' : 'No'], ['Generator', v.generator ? 'Yes' : 'No'], ['Internet', (v.internet || []).join(', ').toUpperCase()], ['Remote monitor', v.remoteMonitoring ? 'Required' : 'Not required']])}
    </div>
  )
}
