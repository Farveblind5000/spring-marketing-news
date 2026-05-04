#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════
// SPRING MARKETING NEWS — Sync Obsidian prompt → Supabase
// Kørsel: node scripts/sync-prompt.js
// ══════════════════════════════════════════════════════════════

const fs = require('fs')
const path = require('path')

// ── Konfiguration ─────────────────────────────────────────────

const OBSIDIAN_NOTE = path.join(
  'C:\\Users\\mieo\\OneDrive - Spring Family ApS\\Desktop\\Obsidian_claude',
  'Claude_design\\Prompts\\Digest System Prompt.md'
)

const ENV_FILE = path.join(__dirname, '..', '.env.local')

// ── Læs env vars ──────────────────────────────────────────────

function loadEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return raw
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .reduce((acc, line) => {
      const eq = line.indexOf('=')
      if (eq === -1) return acc
      const key = line.slice(0, eq).trim()
      const val = line.slice(eq + 1).trim()
      acc[key] = val
      return acc
    }, {})
}

const env = loadEnv(ENV_FILE)
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Mangler NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env.local')
  console.error('   Tilføj: SUPABASE_SERVICE_ROLE_KEY=<din nøgle fra Supabase Dashboard → Project Settings → API>')
  process.exit(1)
}

// ── Læs og rens Obsidian note ─────────────────────────────────

function extractPrompt(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')

  // Fjern YAML frontmatter (--- ... ---)
  const withoutFrontmatter = raw.replace(/^---[\s\S]*?---\s*\n/, '')

  // Stop ved "---" separator (prompt-noter er ikke en del af prompten)
  const parts = withoutFrontmatter.split(/\n---\n/)
  return parts[0].trim()
}

// ── Upsert til Supabase ───────────────────────────────────────

async function syncToSupabase(key, content) {
  const url = `${SUPABASE_URL}/rest/v1/settings`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      key,
      content,
      updated_at: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase fejl (${res.status}): ${err}`)
  }
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('📄 Læser Obsidian note...')

  if (!fs.existsSync(OBSIDIAN_NOTE)) {
    console.error(`❌ Kan ikke finde: ${OBSIDIAN_NOTE}`)
    process.exit(1)
  }

  const prompt = extractPrompt(OBSIDIAN_NOTE)
  const lines = prompt.split('\n').length
  console.log(`   ${lines} linjer, ${prompt.length} tegn`)
  console.log(`   Preview: "${prompt.slice(0, 80)}..."`)

  console.log('\n🔄 Synker til Supabase...')
  await syncToSupabase('digest_prompt', prompt)

  console.log('✅ Digest System Prompt synket til Supabase\n')
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
