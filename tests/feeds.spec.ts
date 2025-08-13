import { describe, it, expect } from 'vitest'
import fs from 'fs'

const topics = ['positivity','narcissism','fitness']

describe('feed json validity', () => {
  for (const t of topics) {
    it(`${t} feed has valid JSON and at least one videoId`, () => {
      const raw = fs.readFileSync(`public/feeds/${t}.json`, 'utf8').replace(/^\uFEFF/, '').trim()
      const j = JSON.parse(raw)
      expect(Array.isArray(j.videos)).toBe(true)
      expect(j.videos.length).toBeGreaterThan(0)
      expect(typeof j.videos[0].videoId).toBe('string')
      expect(j.videos[0].videoId.length).toBeGreaterThan(3)
    })
  }
})
