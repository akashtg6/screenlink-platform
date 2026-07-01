import { AuthLayout } from '@/layouts/auth-layout'
import { LoginForm } from '@/features/auth/login-form'
import Link from 'next/link'

export const metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your ScreenLink engineering workspace."
      footer={
        <>
          New to ScreenLink? <Link href="/signup" className="font-medium text-accent hover:underline">Create a workspace</Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
