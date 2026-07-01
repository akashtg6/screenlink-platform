import { AuthLayout } from '@/layouts/auth-layout'
import { SignupForm } from '@/features/auth/signup-form'

export const metadata = { title: 'Create workspace' }

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Give your engineering team a rigorous, auditable environment — in under a minute."
    >
      <SignupForm />
    </AuthLayout>
  )
}
