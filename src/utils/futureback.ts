import type { FuturebackCondition, Milestone } from '../types'

/** Today as an ISO date (YYYY-MM-DD) — same shape Milestone.date and RoadmapView compare with. */
function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Tokenizes a statement into whole words: letter/digit runs joined by hyphens
 * stay ONE token ("jira-like" ≠ "jira", "migrationese" ≠ "migrate").
 * Unicode-aware so Cyrillic statements tokenize correctly.
 */
const TOKEN_RE = /[\p{L}\p{N}]+(?:[-][\p{L}\p{N}]+)*/gu

/**
 * AC6.2 lint guard: returns the solution keywords found in the statement —
 * deduped, case-insensitive, whole-token matches only, in first-seen order.
 * Whitespace-only statements are treated as clean. Never blocks editing;
 * callers render this as a dismissible banner.
 */
export function lintSolutionTalk(statement: string, keywords: string[]): string[] {
  if (!statement || !statement.trim()) return []
  const wanted = new Set(keywords.map(k => k.toLowerCase()))
  const found: string[] = []
  for (const match of statement.toLowerCase().matchAll(TOKEN_RE)) {
    const token = match[0]
    if (wanted.has(token) && !found.includes(token)) found.push(token)
  }
  return found
}

export function createCondition(text: string): FuturebackCondition {
  return { id: crypto.randomUUID(), text: text.trim() }
}

/**
 * Synthesizes a plain Milestone from a condition (AC6.1). Milestone.date is
 * required and RoadmapView's milestoneStyle ISO-compares dates — an undated
 * milestone would misrender as overdue-amber, so undated conditions promote
 * with date=today (`today` parameter exists for deterministic tests).
 */
export function promoteCondition(
  c: FuturebackCondition,
  today: string = isoToday()
): Milestone {
  return {
    id: crypto.randomUUID(),
    title: c.text,
    date: c.date ?? today,
    reached: false,
  }
}

/**
 * DR-E6-3: promotion state is DERIVED from milestone existence, not stored as
 * a permanent flag. Delete the milestone in RoadmapView ⇒ the condition row
 * quietly renders as a draft again (editable, re-promotable); no stale
 * "On roadmap ✓" pointing at nothing, and the milestone is never auto-restored.
 */
export function isConditionPromoted(
  c: FuturebackCondition,
  milestones: Milestone[]
): boolean {
  if (!c.promotedMilestoneId) return false
  return milestones.some(m => m.id === c.promotedMilestoneId)
}
