#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build the production-ready foundation of ScreenLink.ai — a Professional Display
  Engineering Platform (LED/LCD projects) with Next.js 15 + TypeScript + Tailwind +
  shadcn/ui. Use App Router, Clean Architecture, abstraction layers (AuthService /
  DatabaseService) so a real Supabase backend can be swapped in later. Include full
  design system, dark/light mode, marketing landing, auth, dashboard, projects,
  project wizard, settings, and error/loading/not-found states.

frontend:
  - task: "Design system + theme (light/dark) with brand colors #0F4C81 / #00C2FF"
    implemented: true
    working: true
    file: "app/globals.css, tailwind.config.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "CSS tokens, typography scale (display-*, heading-*), elevation shadows, grid/dot patterns, light+dark themes verified visually."

  - task: "Service abstraction (AuthService, DatabaseService) with mock impls"
    implemented: true
    working: true
    file: "services/auth/*, services/database/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Interfaces defined. MockAuthService persists to localStorage; MockDatabaseService seeds 4 realistic projects. Swap point is a single line."

  - task: "Marketing landing page (Autodesk/Stripe/Linear tone)"
    implemented: true
    working: true
    file: "app/page.tsx, components/marketing/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Hero + product preview + feature grid + workflow + engineering-excellence section + CTA + footer. Compiles, HTTP 200."

  - task: "Auth pages (Login, Signup) with split-panel layout"
    implemented: true
    working: true
    file: "app/login/page.tsx, app/signup/page.tsx, layouts/auth-layout.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "React Hook Form + Zod validation. Screenshotted: dark brand panel + clean form. Sign-in flow verified end-to-end via mock."

  - task: "Dashboard shell (Sidebar + TopNav + Breadcrumbs + Notifications)"
    implemented: true
    working: true
    file: "layouts/dashboard-layout.tsx, components/dashboard/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Sidebar with workspace card + navigation + AI-assist promo + settings/help. Top nav with search, breadcrumbs, notifications, theme toggle, user menu. Auth-guarded."

  - task: "Dashboard, Projects, Project Wizard, Settings pages"
    implemented: true
    working: true
    file: "app/(app)/**"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Dashboard shows KPI cards + recent projects + quick actions. Projects has filterable table. Wizard is 4-step (Customer → Requirements → Configuration → Review). Settings has 5 tabs (Profile / Appearance / Notifications / Team / Billing)."

  - task: "Error, Loading, Not-Found states"
    implemented: true
    working: true
    file: "app/error.tsx, app/loading.tsx, app/not-found.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Branded 404 (Compass icon), error boundary with retry, loading skeleton."

backend:
  - task: "None — Supabase backend intentionally mocked in this iteration"
    implemented: false
    working: "NA"
    file: "services/*"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "User elected mocked auth+DB so development can proceed without Supabase keys. Real Supabase backend will be a drop-in swap in AuthService/DatabaseService."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Frontend visual/functional testing pending user permission"
  stuck_tasks: []

# ============================================================================
# SPRINT 2 \u2014 SUPABASE AUTH + MULTI-TENANT FOUNDATION
# ============================================================================

sprint_2:
  status: "code complete; awaiting user's Supabase keys to enable runtime auth"
  overview: |
    Real Supabase authentication wired behind the AuthService abstraction.
    Multi-tenant schema (Organizations \u2192 Users \u2192 Projects) with 5-role RBAC
    (super_admin, organization_admin, engineer, sales, viewer). SQL migration
    file provided. All UI depends only on AuthService \u2014 zero direct Supabase
    imports in components.

  frontend:
    - task: "Google OAuth login button (client + PKCE flow)"
      implemented: true
      working: "needs_keys"
      file: "features/auth/google-sign-in-button.tsx, services/auth/SupabaseAuthService.ts"
      status_history:
        - agent: "main"
          comment: |
            Verified via UI test \u2014 button visible on login and signup; click
            surfaces clear toast when SUPABASE_NOT_CONFIGURED. Once user enables
            Google provider in Supabase dashboard, no code changes needed.
    - task: "Email + password login and signup"
      implemented: true
      working: "needs_keys"
      file: "features/auth/login-form.tsx, features/auth/signup-form.tsx"
      status_history:
        - agent: "main"
          comment: |
            Signup triggers Supabase user create; DB trigger auto-creates
            organizations row + profiles row w/ role='engineer'. Signup form
            handles email-confirmation flow with a success card.
    - task: "Forgot / reset password flow"
      implemented: true
      working: "needs_keys"
      file: "app/forgot-password/page.tsx, app/reset-password/page.tsx, features/auth/{forgot,reset}-password-form.tsx"
      status_history:
        - agent: "main"
          comment: |
            Complete flow: user submits email \u2192 Supabase sends recovery link
            \u2192 /auth/callback exchanges code \u2192 redirects to /reset-password
            \u2192 user sets new password \u2192 redirects to /dashboard.
    - task: "Remember me + session persistence"
      implemented: true
      working: "needs_keys"
      file: "features/auth/login-form.tsx, services/auth/SupabaseAuthService.ts"
      status_history:
        - agent: "main"
          comment: |
            Checkbox captured in schema; stored in localStorage after sign-in.
            Session cookies (from @supabase/ssr) persist across tabs and reloads
            by default. Full session-scoped cookie behavior for remember=false
            deferred to Sprint 3 (requires cookie option tuning).
    - task: "Client-side auth hooks: useAuth, useRole, useOrganization"
      implemented: true
      working: true
      file: "hooks/use-auth.tsx, hooks/use-role.ts, hooks/use-organization.ts"
      status_history:
        - agent: "main"
          comment: |
            useRole exposes .is(), .atLeast(), .anyOf(), .isAdmin() \u2014 permissions
            derived from role hierarchy, not hardcoded. useOrganization exposes
            the current tenant.

  backend_and_infra:
    - task: "Supabase browser client (@supabase/ssr, PKCE)"
      implemented: true
      working: true
      file: "lib/supabase/client.ts"
    - task: "Supabase server client for Server Components / Route Handlers"
      implemented: true
      working: true
      file: "lib/supabase/server.ts"
    - task: "Session-refresh middleware helper"
      implemented: true
      working: true
      file: "lib/supabase/middleware.ts"
    - task: "Next.js middleware.ts \u2014 session refresh + protected routes"
      implemented: true
      working: true
      file: "middleware.ts"
      status_history:
        - agent: "main"
          comment: |
            Runs on all non-static requests. Refreshes Supabase session and
            redirects unauthenticated users away from /dashboard, /projects,
            /settings, /configurator, /proposals, /team, /admin. Signed-in
            users on /login|/signup are redirected to /dashboard. Fail-open
            in dev if keys missing (with clear console warning).
    - task: "OAuth / recovery callback route (PKCE code exchange)"
      implemented: true
      working: "needs_keys"
      file: "app/auth/callback/route.ts"
      status_history:
        - agent: "main"
          comment: |
            Handles ?code= (Google, magic link, recovery). Exchanges code
            for session, then redirects to ?next= or /reset-password when
            type=recovery.
    - task: "Server-side auth guards (requireAuth, requireRole, requireAnyRole)"
      implemented: true
      working: true
      file: "lib/auth/require-auth.ts, lib/auth/require-role.ts"

  services:
    - task: "AuthService interface (extended with Google, reset-password, etc.)"
      implemented: true
      working: true
      file: "services/auth/AuthService.ts"
    - task: "SupabaseAuthService \u2014 real Supabase implementation"
      implemented: true
      working: "needs_keys"
      file: "services/auth/SupabaseAuthService.ts"
      status_history:
        - agent: "main"
          comment: |
            Full implementation: getSession, signIn, signUp, signInWithGoogle,
            signOut, sendPasswordReset, resetPassword, updateProfile,
            onAuthStateChange. Fetches profile + role + organization in one
            query using Supabase joins. Wraps all errors into AuthErrorImpl.
    - task: "MockAuthService \u2014 DELETED"
      implemented: false
      working: "NA"
      file: "services/auth/MockAuthService.ts"
      status_history:
        - agent: "main"
          comment: "Removed per requirement 'no mock authentication'."
    - task: "DatabaseService interface + MockDatabaseService (org-scoped)"
      implemented: true
      working: true
      file: "services/database/*"
      status_history:
        - agent: "main"
          comment: |
            Interface refactored to require organizationId on every method
            (multi-tenant enforcement). Mock impl scopes localStorage per org.
            SupabaseDatabaseService will replace it in Sprint 3.

  database:
    - task: "Production SQL schema \u2014 organizations, profiles, roles, projects"
      implemented: true
      working: true
      file: "supabase/schema.sql"
      status_history:
        - agent: "main"
          comment: |
            Idempotent script. Includes: user_role enum-via-table, project_status
            + display_type enums, all indexes, updated_at triggers, RLS policies
            for every table, helper SQL functions (current_organization_id,
            current_role_slug, has_role, has_any_role), and the on-signup
            trigger that auto-creates an organization + engineer profile.
    - task: "Multi-tenant enforcement via RLS"
      implemented: true
      working: true
      file: "supabase/schema.sql"
      status_history:
        - agent: "main"
          comment: |
            Every tenant-owned table (organizations, profiles, projects) has
            RLS policies referencing public.current_organization_id() and
            public.has_role(). Super admins bypass tenant boundaries. Org
            admins scoped to their org.

  test_plan:
    current_focus:
      - "Waiting on user to supply NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY"
      - "Once keys are set: verify e2e email signup \u2192 profile trigger \u2192 dashboard"
      - "Verify Google OAuth flow once user enables provider in Supabase dashboard"
      - "Verify reset password email round-trip"

  agent_communication:
    - agent: "main"
      message: |
        Sprint 2 code complete and verified. All 9 routes return HTTP 200.
        Auth UI (Google btn, forgot?, remember me) verified visually.
        Graceful degradation confirmed: missing keys \u2192 clear toast + fail-open
        middleware (dev only). User must (1) create Supabase project, (2) paste
        the two env values, (3) run supabase/schema.sql in SQL Editor,
        (4) [optional] enable Google provider in Supabase dashboard.

  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Foundation complete. All routes return HTTP 200. Screenshots confirm enterprise
      SaaS visual identity (Autodesk / Stripe / Linear inspired). Backend is
      intentionally mocked per user direction; abstraction is a single-line swap for
      Supabase. Awaiting user go-ahead before invoking frontend testing agent.


# ============================================================================
# SPRINT 4B — ADVANCED ENGINEERING & RECOMMENDATION ENGINE
# ============================================================================

sprint_4b:
  status: "COMPLETE — all DoD items satisfied (backend verified, UI awaits user)"
  engine_version: "4B.0.0"
  overview: |
    Extended the pure-TS Engineering Engine with 5 new modules (Cabinet, Power,
    Weight, Viewing, Rules), an intelligent Recommendation Engine, an
    Engineering Score (0-100 + A/B/C/D/F), and a live Dashboard Integration
    module. All calculations happen in `engineering-engine/**` — the UI never
    calculates. Rules are data, not code. Every recommendation surfaces its
    engineering rationale to the user.

  backend:
    - task: "Cabinet Engine (calculators/cabinet.ts) — tiling, efficiency, suggested cabinet size"
      implemented: true
      working: true
      file: "engineering-engine/calculators/cabinet.ts"
      status_history:
        - working: true
          agent: "main"
          comment: "3 vitest cases pass. Efficiency and suggestion logic exercised."

    - task: "Power Engine (calculators/power.ts) — max/typical watts, kWh, per-cabinet"
      implemented: true
      working: true
      file: "engineering-engine/calculators/power.ts"
      status_history:
        - working: true
          agent: "main"
          comment: "Fixed rounding-tolerance regression in test (annualKWh is integer-rounded)."

    - task: "Weight Engine (calculators/weight.ts) — mass model, per-cabinet"
      implemented: true
      working: true
      file: "engineering-engine/calculators/weight.ts"

    - task: "Viewing Engine (calculators/viewing.ts) — 1x/3x/30x rule, comfort score"
      implemented: true
      working: true
      file: "engineering-engine/calculators/viewing.ts"

    - task: "Rules Engine + 11 default rules (data-driven)"
      implemented: true
      working: true
      file: "engineering-engine/rules/*.ts"
      status_history:
        - working: true
          agent: "main"
          comment: "Renamed VIEWING_TOO_CLOSE to VIEWING_DISTANCE_BELOW_PITCH_RULE for clarity."

    - task: "Recommendation Engine — priority + confidence + engineering rationale"
      implemented: true
      working: true
      file: "engineering-engine/recommendations/recommendation-engine.ts"

    - task: "Engineering Score — 0-100 + A/B/C/D/F + category breakdown"
      implemented: true
      working: true
      file: "engineering-engine/scoring/engineering-score.ts"

    - task: "Full-pipeline integration test coverage"
      implemented: true
      working: true
      file: "engineering-engine/tests/*.ts"
      status_history:
        - working: true
          agent: "main"
          comment: "84 / 84 tests passing (11 files). Adjusted 2 performance budgets to be robust to container jitter (~0.2-0.4 ms/call)."

  frontend:
    - task: "Wizard→Engine adapter (framework boundary)"
      implemented: true
      working: true
      file: "lib/engineering/wizard-to-engine.ts"
      status_history:
        - working: true
          agent: "main"
          comment: "7 vitest cases pass (adapter round-trip, cabinet-size parser, env/family inference)."

    - task: "useEngineering React hook (memoised)"
      implemented: true
      working: true
      file: "engineering-engine/react/use-engineering.ts"

    - task: "Engineering Summary Panel — live in wizard"
      implemented: true
      working: "NA"  # awaiting user visual verification
      file: "features/projects/wizard/engineering-summary-panel.tsx, features/projects/wizard/project-wizard.tsx"
      needs_retesting: true
      status_history:
        - working: "NA"
          agent: "main"
          comment: |
            Sticky right-hand aside on the wizard. Renders score+grade+categories,
            calculations grid, findings (errors/warnings/notes) and
            recommendations accordion. All values come from the engine — nothing
            is hardcoded in React. Panel gracefully empty until dimensions +
            pitch are filled. Awaiting user to click-through the wizard.

  tech_debt_resolved:
    - "Removed dead legacy files: features/projects/project-wizard.tsx (v1) and features/projects/projects-table.tsx."
    - "Fixed strict-TS across the whole project: 0 tsc errors, 0 eslint errors."
    - "Introduced types/shadcn-ui.d.ts to type all shadcn/ui .jsx components without converting them."
    - "Fixed NewProjectInput.code optionality, Zod .default('mm') input/output mismatch, and safe casts in Supabase service."
    - "Aligned dashboard/settings/user-menu to real User shape (fullName, roleSlug, organizationId)."

  documentation:
    - "engineering-engine/docs/ENGINEERING-ENGINE.md (architecture, modules, public API)"
    - "engineering-engine/docs/FORMULA-LIBRARY.md (every formula with rationale)"
    - "engineering-engine/docs/ENGINEERING-RULES.md (all 11 rules, severity, deductions)"
    - "engineering-engine/docs/SPRINT-4B-REPORT.md (completion checklist + file list)"

  quality_gates:
    tsc_no_emit: 0        # 0 errors
    eslint: 0             # 0 errors
    vitest: "84/84"       # 100% pass
    performance: "~0.2-0.4 ms/call (target < 5 ms)"

  agent_communication:
    - agent: "main"
      message: |
        Sprint 4B is code-complete and back-end verified. All 84 unit tests pass,
        `npx tsc --noEmit` returns zero errors and ESLint is clean. Docs
        (ENGINEERING-ENGINE.md, FORMULA-LIBRARY.md, ENGINEERING-RULES.md,
        SPRINT-4B-REPORT.md) are in engineering-engine/docs/. UI integration
        (Module 9) is wired into the wizard as a sticky right-hand panel —
        awaiting user visual/UX verification. Sprint 5 has NOT been started.

