'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/data-display/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/use-auth'
import { initials } from '@/utils/format'
import { toast } from 'sonner'
import { Moon, Sun, Monitor, Loader2, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { user, organization, updateProfile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const [form, setForm] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    organization: organization?.name || '',
    jobTitle: user?.jobTitle || '',
  })

  // Hydrate the form whenever the authenticated profile arrives/changes.
  // Without this, the form keeps the empty values captured on first render
  // (before the async profile fetch resolves).
  useEffect(() => {
    if (!user) return
    setForm({
      name: user.fullName || '',
      email: user.email || '',
      organization: organization?.name || '',
      jobTitle: user.jobTitle || '',
    })
  }, [user, organization])

  async function save() {
    setSaving(true)
    try {
      await updateProfile({ fullName: form.name, jobTitle: form.jobTitle })
      toast.success('Profile updated')
    } catch (e) {
      toast.error('Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      console.error('[settings] signOut failed', err)
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  const themeChoices = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your workspace preferences, appearance, notifications and team."
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-sm">Profile</CardTitle>
              <CardDescription>How you appear across ScreenLink to your team and customers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={form.name || 'User avatar'} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    {initials(form.name || 'ScreenLink')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">Upload photo</Button>
                  <p className="mt-2 text-xs text-muted-foreground">PNG, JPG or SVG. Max 2MB.</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} readOnly disabled className="opacity-80" />
                  <p className="text-[11px] text-muted-foreground">Managed by your sign-in provider.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="organization">Organization</Label>
                  <Input id="organization" value={form.organization} readOnly disabled className="opacity-80" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jobTitle">Job title</Label>
                  <Input id="jobTitle" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" placeholder="A short description of your engineering focus." />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-heading-sm">Session</CardTitle>
              <CardDescription>Sign out of ScreenLink on this device.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{form.email || 'Signed in'}</p>
                <p className="text-xs text-muted-foreground">You will be redirected to the login page.</p>
              </div>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                disabled={signingOut}
                data-testid="settings-signout"
              >
                {signingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                Sign out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-sm">Appearance</CardTitle>
              <CardDescription>Customize the interface for how you work best.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {themeChoices.map((c) => {
                  const active = theme === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => setTheme(c.id)}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                        active ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-card hover:bg-muted',
                      )}
                    >
                      <c.icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.id === 'system' ? 'Follow OS preference' : c.id === 'light' ? 'Bright, high contrast' : 'Low glare for long sessions'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-sm">Notifications</CardTitle>
              <CardDescription>Choose what updates ScreenLink sends you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { t: 'Project reviews', d: 'When a project you own is submitted for review or approved.' },
                { t: 'BOQ changes', d: 'When a bill of quantities is revised on a project you follow.' },
                { t: 'Team activity', d: 'When teammates comment, mention or assign you.' },
                { t: 'Product updates', d: 'Occasional emails about new features.' },
              ].map((row) => (
                <div key={row.t} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{row.t}</p>
                    <p className="text-xs text-muted-foreground">{row.d}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-sm">Team</CardTitle>
              <CardDescription>Invite engineers, reviewers and account owners to your workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border p-10 text-center">
                <p className="text-sm font-medium text-foreground">Team management is coming soon</p>
                <p className="mt-1 text-xs text-muted-foreground">Role-based access with engineer, reviewer and admin roles.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-sm">Billing</CardTitle>
              <CardDescription>Manage your plan, invoices and payment methods.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border p-10 text-center">
                <p className="text-sm font-medium text-foreground">Billing will activate at general availability</p>
                <p className="mt-1 text-xs text-muted-foreground">You’re currently on the Founding Engineer preview plan.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
