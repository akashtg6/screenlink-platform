# ScreenLink.ai — Sprint 2 Architecture

## Authentication & Multi-Tenant Overview

```
┌────────────────────────────────────────────────────────────┐
│                            Client (Browser)                             │
│                                                                          │
│   ╔════════════╗    ╔════════════╗    ╔════════════════════════╗                     │
│   ║ LoginForm ║═────║ SignupForm║═────║ ForgotPasswordForm  ║                     │
│   ╚═════╤══════╝    ╚════╤═══════╝    ╚══════════╤═════════════╝                     │
│         │                │                     │                            │
│         └───────┬────────┴────────────────────┘                            │
│                 │                                                        │
│          ┌─────┴───────────┐    ┌────────────────────────────┐            │
│          │ useAuth()   │─────│ useRole() / useOrganization()   │            │
│          └─────┬───────┘    └────────────────────────────┘            │
│                │                                                         │
│                ▼                                                         │
│          ┌────────────────────┐                                       │
│          │  AuthService (IF) │   ◄───  UI depends ONLY on this abstraction  │
│          └─────────┬─────────┘                                       │
│                    │                                                     │
│          ┌─────────┴───────────────┐                                     │
│          │  SupabaseAuthService     │                                     │
│          │  (concrete implementation) │                                   │
│          └───────────────┬──────────┘                                     │
│                          │                                                │
│            ┌────────────┴────────────┐                                    │
│            │ @supabase/ssr browser client │                                │
│            │ (PKCE flow, cookie storage)  │                                │
│            └────────────┬────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
                            │           HTTPS + Set-Cookie
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                              Next.js Edge / Node                          │
│                                                                            │
│  ┌────────────────────────┐      ┌────────────────────────────────────┐    │
│  │  middleware.ts     │──────│ lib/supabase/middleware.ts        │    │
│  │  • refresh session│      │ (server client bound to req)      │    │
│  │  • protect routes  │      └────────────────────────────────────┘    │
│  └─────────┬──────────┘                                              │
│            │                                                              │
│            ▼                                                              │
│  ┌─────────────────────────┐   ┌───────────────────────────────┐          │
│  │  Server Components │◄───│  lib/supabase/server.ts     │          │
│  │  Route Handlers    │    │  (server client + cookies)  │          │
│  │  requireAuth /     │    └───────────────────────────────┘          │
│  │  requireRole       │                                                  │
│  └─────────────────────────┘                                                  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────┐                │
│  │  /app/auth/callback/route.ts  (PKCE code ↔ session exchange)  │        │
│  └─────────────────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
                                    │   HTTPS
                                    ▼
┌──────────────────────────────────────────────────────────────┐
│                              Supabase                                     │
│                                                                            │
│  auth.users        ──(trigger)────▶  public.organizations  (auto-created) │
│                                     public.profiles       (role=engineer) │
│                                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐              │
│  │ roles         │  │ organizations │  │ projects  │  ◄── all RLS-scoped │
│  │ (system=true) │  │ (tenants)     │  │ (by org)  │     by org_id      │
│  └──────────────────┘  └──────────────────┘  └───────────┘              │
└──────────────────────────────────────────────────────────────┘
```

## Data Ownership Model

**Organization → Users → Projects** (never User → Projects).

Every `profiles` row has `organization_id`; every `projects` row has `organization_id`.
RLS policies enforce tenant isolation via helper function `public.current_organization_id()`.

## Roles & Hierarchy

| Slug                  | Name                | Hierarchy | Default Capabilities                                   |
| --------------------- | ------------------- | --------: | ------------------------------------------------------ |
| `super_admin`         | Super Admin         |       100 | Platform staff — bypasses all org boundaries in RLS.  |
| `organization_admin`  | Organization Admin  |        80 | Full control within org (users, projects, settings).   |
| `engineer`            | Engineer            |        60 | Create + edit projects. Default role for new signups.  |
| `sales`               | Sales               |        40 | Edit projects (proposals); no delete.                  |
| `viewer`              | Viewer              |        20 | Read-only access to organization data.                 |

Permissions are **not** hardcoded. They are enforced in:
1. **Postgres RLS** via `has_role()` / `has_any_role()` functions
2. **Server guards** via `requireRole()` / `requireAnyRole()`
3. **Client hooks** via `useRole().is()` / `.atLeast()` / `.anyOf()`

Future: add a `role_permissions` table linking `roles ↔ permissions` to move all
checks to a permission-based model with zero code change to consumers.

## Session Lifecycle

1. User signs in (email/pw or Google) → `SupabaseAuthService.signIn(...)`
2. Supabase issues access + refresh tokens → stored as HTTP-only cookies (SameSite=Lax)
3. Every request hits `middleware.ts` → `updateSession()` refreshes if needed
4. Server components use `createServerSupabaseClient()` + `auth.getUser()` (validated)
5. Client components use `useAuth()` + `onAuthStateChange` subscription
6. Sign-out clears cookies + local session state; middleware redirects on next protected navigation

## Files added / changed

See root `README.md` and the diff for Sprint 2.
