'use client'

import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  step: number; totalSteps: number
  onBack: () => void; onNext: () => void; onSaveDraft: () => Promise<void> | void; onSubmit: () => Promise<void> | void
  submitting?: boolean; savingDraft?: boolean
}

export function WizardNavigation({ step, totalSteps, onBack, onNext, onSaveDraft, onSubmit, submitting, savingDraft }: Props) {
  return (
    <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border pt-6 md:flex-row md:items-center">
      <Button type="button" variant="ghost" onClick={onBack} disabled={step === 1}>
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
      </Button>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={() => onSaveDraft()} disabled={savingDraft}>
          {savingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          Save draft
        </Button>
        {step < totalSteps ? (
          <Button type="button" onClick={onNext}>Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
        ) : (
          <Button type="button" onClick={() => onSubmit()} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit for review
          </Button>
        )}
      </div>
    </div>
  )
}
