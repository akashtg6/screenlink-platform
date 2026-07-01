import { AuthLayout } from '@/layouts/auth-layout'
import { ForgotPasswordForm } from '@/features/auth/forgot-password-form'

export const metadata = { title: 'Forgot password' }

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email associated with your ScreenLink workspace and we’ll send you a secure reset link."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
