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
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Foundation complete. All routes return HTTP 200. Screenshots confirm enterprise
      SaaS visual identity (Autodesk / Stripe / Linear inspired). Backend is
      intentionally mocked per user direction; abstraction is a single-line swap for
      Supabase. Awaiting user go-ahead before invoking frontend testing agent.
