// Diagnostic: verify the exact client-side profile query against production Supabase.
// Run: node scripts/diagnose-profile-rls.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('/app/.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
)

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const EMAIL = 'qa+test051_1783102811@screenlink.ai'
const PASSWORD = 'TestPassword123!@#'

async function main() {
  console.log('1) Signing in with QA account...')
  const { data, error } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (error) {
    console.log('   SIGN-IN FAILED:', error.message, '(status', error.status + ')')
    console.log('   Cannot verify RLS as authenticated user. Testing anon SELECT policy visibility...')
    const { data: anonData, error: anonErr } = await sb.from('profiles').select('id').limit(1)
    console.log('   anon profiles select ->', anonErr ? `error: ${anonErr.message}` : `rows: ${anonData?.length}`)
    return
  }
  const uid = data.session.user.id
  console.log('   SIGNED IN. uid =', uid)

  console.log('2) Plain profiles select (no joins)...')
  const t1 = Date.now()
  const p1 = await sb.from('profiles').select('id, email, full_name, avatar_url, job_title, organization_id, role_id').eq('id', uid).single()
  console.log('   ->', p1.error ? `ERROR: ${p1.error.message} [${p1.error.code}]` : JSON.stringify(p1.data), `(${Date.now() - t1}ms)`)

  console.log('3) Full query WITH roles + organizations joins (exact app query)...')
  const t2 = Date.now()
  const p2 = await sb
    .from('profiles')
    .select('id, email, full_name, avatar_url, job_title, organization_id, role_id, is_active, created_at, updated_at, roles ( id, slug, name, description, hierarchy, is_system ), organizations ( id, name, slug, logo_url, website, industry, country, created_at, updated_at )')
    .eq('id', uid)
    .single()
  if (p2.error) {
    console.log('   -> ERROR:', p2.error.message, `[${p2.error.code}]`, `(${Date.now() - t2}ms)`)
  } else {
    console.log('   -> OK', `(${Date.now() - t2}ms)`)
    console.log('   roles embed:', JSON.stringify(p2.data.roles))
    console.log('   organizations embed:', JSON.stringify(p2.data.organizations))
  }

  console.log('4) Direct roles table select...')
  const p3 = await sb.from('roles').select('id, slug, name').limit(3)
  console.log('   ->', p3.error ? `ERROR: ${p3.error.message}` : `rows: ${p3.data?.length}`)

  console.log('5) Direct organizations table select...')
  const p4 = await sb.from('organizations').select('id, name').limit(3)
  console.log('   ->', p4.error ? `ERROR: ${p4.error.message}` : `rows: ${p4.data?.length}`)

  await sb.auth.signOut()
}

main().catch((e) => console.error('FATAL:', e))
