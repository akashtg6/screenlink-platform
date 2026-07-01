import { AuthLayout } from '@/layouts/auth-layout'
import { ResetPasswordForm } from '@/features/auth/reset-password-form'

export const metadata = { title: 'Reset password' }

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password. You’ll be signed in automatically once it’s updated."
    >
      <ResetPasswordForm />
    </AuthLayout>
  )
}
