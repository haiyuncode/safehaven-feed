import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const topics = ['positivity','narcissism','fitness']

test('build feeds script runs and updates generatedAt', () => {
  execSync(process.platform === 'win32' ? 'node scripts/build-feeds.cjs' : 'node scripts/build-feeds.cjs', { stdio: 'ignore' })
  for (const t of topics) {
    const raw = fs.readFileSync(`public/feeds/${t}.json`, 'utf8').replace(/^\uFEFF/, '').trim()
    const j = JSON.parse(raw)
    assert.ok(typeof j.generatedAt === 'string' && j.generatedAt.length > 0)
    assert.ok(Array.isArray(j.videos))
    assert.ok(j.videos.length > 0)
    assert.strictEqual(typeof j.videos[0].videoId, 'string')
    assert.ok(j.videos[0].videoId.length > 3)
  }
})
