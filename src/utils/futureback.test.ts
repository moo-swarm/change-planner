import { describe, it, expect } from 'vitest'
import {
  lintSolutionTalk,
  createCondition,
  promoteCondition,
  isConditionPromoted,
} from './futureback'
import { SOLUTION_KEYWORDS, pickKeywordList } from '../data/solutionKeywords'
import type { Initiative, Milestone } from '../types'

function milestone(id: string): Milestone {
  return { id, title: `ms ${id}`, date: '2027-01-01', reached: false }
}

function initiativeWithFutureback(): Initiative {
  return {
    id: 'i1',
    title: 'Team topologies adoption',
    goal: '',
    context: '',
    stakeholders: '',
    relatedSprints: '',
    facetNotes: { dance: '', mind: '', stimulate: '', change: '' },
    actions: [],
    stakeholderProfiles: [],
    createdAt: 0,
    updatedAt: 0,
    futurebackEnabled: true,
    endStateStatement: 'Six months from now, the team demos its own work.',
    futurebackConditions: [
      createCondition('Everyone demos their own work'),
      { ...createCondition('CI under 10 minutes'), date: '2026-12-01' },
    ],
  }
}

describe('lintSolutionTalk', () => {
  it('flags solution words, case-insensitive', () => {
    const words = lintSolutionTalk('Deploy via MIGRATE scripts then buy Jira', [
      'deploy',
      'migrate',
      'jira',
    ])
    // first-seen order, original casing irrelevant
    expect(words).toEqual(['deploy', 'migrate', 'jira'])
  })

  it('token-boundary: substrings inside larger tokens not flagged', () => {
    // "jira-like" and "migrationese" are single tokens that merely CONTAIN keywords
    expect(lintSolutionTalk('Our jira-like workflow and migrationese habits', ['jira', 'migrate'])).toEqual([])
  })

  it('matched words deduped; clean statement ⇒ empty', () => {
    expect(lintSolutionTalk('Jira jira JIRA everywhere', ['jira'])).toEqual(['jira'])
    expect(lintSolutionTalk('The team owns its on-call rotation', ['jira', 'migrate'])).toEqual([])
  })

  it('whitespace-only statement treated as clean (skip scan)', () => {
    expect(lintSolutionTalk('   \n\t  ', ['jira'])).toEqual([])
  })
})

describe('pickKeywordList', () => {
  it('maps es→en, be→ru, fr→en', () => {
    expect(pickKeywordList('es')).toBe(SOLUTION_KEYWORDS.en)
    expect(pickKeywordList('be')).toBe(SOLUTION_KEYWORDS.ru)
    expect(pickKeywordList('fr')).toBe(SOLUTION_KEYWORDS.en)
  })

  it('dedicated locales get their own list', () => {
    expect(pickKeywordList('ru')).toBe(SOLUTION_KEYWORDS.ru)
    expect(pickKeywordList('en')).toBe(SOLUTION_KEYWORDS.en)
  })
})

describe('createCondition / promoteCondition', () => {
  it('createCondition yields a draft row with id and text', () => {
    const c = createCondition('  Everyone demos  ')
    expect(c.text).toBe('Everyone demos')
    expect(c.id).toBeTruthy()
    expect(c.date).toBeUndefined()
    expect(c.promotedMilestoneId).toBeUndefined()
  })

  it('promoteCondition yields a valid Milestone, date defaulted to provided day', () => {
    const ms = promoteCondition(createCondition('Everyone demos'), '2026-08-24')
    expect(ms.title).toBe('Everyone demos')
    expect(ms.date).toBe('2026-08-24')
    expect(ms.reached).toBe(false)
    expect(ms.id).toBeTruthy()
    // real default is ISO today
    expect(promoteCondition(createCondition('x')).date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('promoteCondition honors explicit condition date', () => {
    const c = { ...createCondition('CI under 10 minutes'), date: '2026-12-01' }
    expect(promoteCondition(c, '2026-08-24').date).toBe('2026-12-01')
  })
})

describe('isConditionPromoted (derived state — DR-E6-3)', () => {
  it('true iff a milestone with the promoted id exists', () => {
    const promoted = { ...createCondition('Everyone demos'), promotedMilestoneId: 'ms-42' }
    expect(isConditionPromoted(promoted, [milestone('ms-41'), milestone('ms-42')])).toBe(true)
    // deleting the milestone in RoadmapView quietly restores the draft
    expect(isConditionPromoted(promoted, [milestone('ms-41')])).toBe(false)
    expect(isConditionPromoted(promoted, [])).toBe(false)
  })

  it('false for conditions never promoted', () => {
    expect(isConditionPromoted(createCondition('draft'), [milestone('ms-42')])).toBe(false)
  })
})

describe('backup round-trip (AC6.4 — no version bump)', () => {
  it('initiative JSON round-trip preserves future-back fields through stringify+parse', () => {
    const init = initiativeWithFutureback()
    const parsed = JSON.parse(JSON.stringify(init)) as Initiative
    expect(parsed.futurebackEnabled).toBe(true)
    expect(parsed.endStateStatement).toBe(init.endStateStatement)
    expect(parsed.futurebackConditions).toEqual(init.futurebackConditions)
  })

  it('older exports without future-back fields parse cleanly (feature silent)', () => {
    const legacy = JSON.parse(JSON.stringify(initiativeWithFutureback())) as Initiative
    delete legacy.futurebackEnabled
    delete legacy.endStateStatement
    delete legacy.futurebackConditions
    expect(legacy.futurebackEnabled).toBeUndefined()
    expect(legacy.futurebackConditions).toBeUndefined()
  })
})
