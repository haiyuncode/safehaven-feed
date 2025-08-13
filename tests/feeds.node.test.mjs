import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'

const topics = ['positivity','narcissism','fitness']

for (const t of topics) {
  test(`${t} feed has valid JSON and at least one videoId`, () => {
    const raw = fs.readFileSync(`public/feeds/${t}.json`, 'utf8').replace(/^\uFEFF/, '').trim()
    const j = JSON.parse(raw)
    assert.ok(Array.isArray(j.videos))
    assert.ok(j.videos.length > 0)
    assert.strictEqual(typeof j.videos[0].videoId, 'string')
    assert.ok(j.videos[0].videoId.length > 3)
  })
}
