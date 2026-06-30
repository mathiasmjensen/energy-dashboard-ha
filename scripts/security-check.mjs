import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const forbiddenPatterns = [
  { label: 'Hardcoded HA password', pattern: /REDACTED_PASSWORD/g },
  { label: 'Known FoxESS API key', pattern: /TEST_FOXESS_API_KEY/g },
  { label: 'Private LAN URL', pattern: /https?:\/\/(?:192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[0-1])\.)[^\s"')]+/g },
  { label: 'Bearer token literal', pattern: /Bearer\s+(?!replace-with-)[A-Za-z0-9._-]{20,}/g },
]
const blockedTrackedFiles = ['home-assistant/secrets.yaml']
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'playwright-report', 'test-results', 'server-data'])
const ignoredFiles = new Set(['package-lock.json'])
const ignoredRelativeFiles = new Set(['scripts/security-check.mjs'])
const findings = []

for (const blocked of blockedTrackedFiles) {
  if (fs.existsSync(path.join(root, blocked))) {
    findings.push(`${blocked}: tracked secrets file should not exist; keep only an example file`)
  }
}

walk(root)

if (findings.length) {
  console.error('Security check failed:\n')
  for (const finding of findings) {
    console.error(`- ${finding}`)
  }
  process.exit(1)
}

console.log('Security check passed.')

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') {
      findings.push(`${path.relative(root, path.join(dir, entry.name))}: environment file should not be committed`)
      continue
    }

    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue
      walk(path.join(dir, entry.name))
      continue
    }

    if (ignoredFiles.has(entry.name)) continue

    const filePath = path.join(dir, entry.name)
    const rel = path.relative(root, filePath)
    if (ignoredRelativeFiles.has(rel)) continue
    if (!isTextLike(rel)) continue

    const content = fs.readFileSync(filePath, 'utf8')
    for (const { label, pattern } of forbiddenPatterns) {
      pattern.lastIndex = 0
      if (pattern.test(content)) {
        findings.push(`${rel}: ${label}`)
      }
    }
  }
}

function isTextLike(rel) {
  return /\.(?:md|txt|json|ya?ml|ts|tsx|js|mjs|cjs|css|html|svg|env|example)$/i.test(rel) || !path.extname(rel)
}
