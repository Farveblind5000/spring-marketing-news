#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════
// SPRING MARKETING NEWS — Sync Obsidian prompts → Supabase
// Kørsel: node scripts/sync-prompt.js
// ══════════════════════════════════════════════════════════════

const fs = require('fs')
const path = require('path')

// ── Konfiguration ─────────────────────────────────────────────

const PROMPTS_DIR = path.join(__dirname, '..', '01_docs', 'Prompts')
const ENV_FILE = path.join(__dirname, '..', '.env.local')

// Mapping af filnavne → settings-key i Supabase
const PROMPTS = [
  { file: 'Digest System Prompt.md', settingsKey: 'digest_prompt' },
  { file: 'Short Summary Prompt.md', settingsKey: 'short_summary_prompt' },
  { file: 'Unified Output Prompt.md', settingsKey: 'unified_prompt' },
]

// ── Læs env vars ──────────────────────────────────────────────

function loadEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return raw
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .reduce((acc, line) => {
      const eq = line.indexOf('=')
      if (eq === -1) return acc
      acc[line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
      return acc
    }, {})
}

const env = loadEnv(ENV_FILE)
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Mangler NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env.local')
  process.exit(1)
}

// ── Læs og rens prompt-fil ────────────────────────────────────

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
  console.log(`📂 Synker ${PROMPTS.length} prompts fra ${PROMPTS_DIR}\n`)

  for (const { file, settingsKey } of PROMPTS) {
    const filePath = path.join(PROMPTS_DIR, file)

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Springer over: ${file} (ikke fundet)`)
      continue
    }

    const prompt = extractPrompt(filePath)
    const lines = prompt.split('\n').length
    console.log(`📄 ${file}`)
    console.log(`   → key: ${settingsKey}`)
    console.log(`   → ${lines} linjer, ${prompt.length} tegn`)
    console.log(`   → preview: "${prompt.slice(0, 70)}..."`)

    await syncToSupabase(settingsKey, prompt)
    console.log(`   ✅ synket\n`)
  }

  console.log('🎉 Alle prompts synket til Supabase')
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
