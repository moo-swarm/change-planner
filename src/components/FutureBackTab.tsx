import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FuturebackCondition, Initiative, Milestone } from '../types'
import {
  createCondition,
  isConditionPromoted,
  lintSolutionTalk,
  promoteCondition,
} from '../utils/futureback'
import { pickKeywordList } from '../data/solutionKeywords'

interface Props {
  initiative: Initiative
  milestones: Milestone[]
  onPatch: (partial: Partial<Initiative>) => void
  /** "Not now" — user declines enablement; returns to the workspace tab */
  onClose: () => void
}

/**
 * Future-back planning mode (E6), opt-in per initiative (AC6.5): always-visible
 * tab whose content gates on initiative.futurebackEnabled. Statement first,
 * then conditions drafted backwards; promotion synthesizes PLAIN Milestones so
 * RoadmapView/ProgressView stay untouched (AC6.3 by non-interference).
 *
 * The lint guard (AC6.2) is a debounced amber banner, never a blocker; dismissal
 * lasts the session only and suppresses the words seen when dismissed — a newly
 * typed solution word still warns.
 */
export default function FutureBackTab({ initiative, milestones, onPatch, onClose }: Props) {
  const { t, i18n } = useTranslation()

  // Debounced mirror of the statement feeding the lint scan (~300ms)
  const [lintText, setLintText] = useState(initiative.endStateStatement ?? '')
  const [dismissedWords, setDismissedWords] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    const id = setTimeout(() => setLintText(initiative.endStateStatement ?? ''), 300)
    return () => clearTimeout(id)
  }, [initiative.endStateStatement])

  if (!initiative.futurebackEnabled) {
    return (
      <div className="card max-w-xl mx-auto text-center py-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
          {t('futureback.pitch_title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-4">
          {t('futureback.pitch_body')}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => onPatch({ futurebackEnabled: true })}>
            {t('futureback.enable')}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('futureback.not_now')}
          </button>
        </div>
      </div>
    )
  }

  const keywords = pickKeywordList(i18n.language.split('-')[0])
  const matchedWords = lintSolutionTalk(lintText, keywords).filter(w => !dismissedWords.has(w))
  const conditions = initiative.futurebackConditions ?? []
  const statement = initiative.endStateStatement ?? ''

  // Promotion is ONE atomic patch: milestone append + condition stamp land together,
  // so an interrupted save can never strand a half-promoted row.
  const promoteOne = (c: FuturebackCondition) => {
    if (isConditionPromoted(c, milestones)) return
    const ms = promoteCondition(c)
    onPatch({
      milestones: [...(initiative.milestones ?? []), ms],
      futurebackConditions: conditions.map(x =>
        x.id === c.id ? { ...x, promotedMilestoneId: ms.id } : x
      ),
    })
  }
  const promoteAll = () => {
    const promotable = conditions.filter(c => !isConditionPromoted(c, milestones))
    if (promotable.length === 0) return
    const added = promotable.map(c => promoteCondition(c))
    const msIdByCondition = new Map(promotable.map((c, i) => [c.id, added[i].id]))
    onPatch({
      milestones: [...(initiative.milestones ?? []), ...added],
      futurebackConditions: conditions.map(x =>
        msIdByCondition.has(x.id) ? { ...x, promotedMilestoneId: msIdByCondition.get(x.id) } : x
      ),
    })
  }

  const updateCondition = (id: string, partial: Partial<FuturebackCondition>) => {
    onPatch({ futurebackConditions: conditions.map(c => (c.id === id ? { ...c, ...partial } : c)) })
  }
  const removeCondition = (id: string) => {
    onPatch({ futurebackConditions: conditions.filter(c => c.id !== id) })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="card">
        <label htmlFor="futureback-statement" className="label font-semibold text-gray-900 dark:text-gray-50">
          {t('futureback.statement_label')}
        </label>
        <textarea
          id="futureback-statement"
          className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={5}
          placeholder={t('futureback.statement_placeholder')}
          value={statement}
          onChange={e => onPatch({ endStateStatement: e.target.value })}
        />

        {matchedWords.length > 0 && (
          <div
            role="status"
            className="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 text-sm text-amber-700 dark:text-amber-300"
          >
            <span aria-hidden>⚠</span>
            <span className="flex-1">{t('futureback.lint_warning', { words: matchedWords.join(', ') })}</span>
            <button
              type="button"
              onClick={() => setDismissedWords(prev => new Set([...prev, ...matchedWords]))}
              className="shrink-0 font-medium hover:underline"
            >
              {t('futureback.lint_dismiss')}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">
          {t('futureback.conditions_label')}
        </h2>
        <div className="space-y-2">
          {conditions.map(c => {
            const promoted = isConditionPromoted(c, milestones)
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-2">
                <input
                  className="input flex-1 min-w-[12rem]"
                  placeholder={t('futureback.condition_placeholder')}
                  value={c.text}
                  onChange={e => updateCondition(c.id, { text: e.target.value })}
                />
                <input
                  type="date"
                  className="input w-auto"
                  value={c.date ?? ''}
                  onChange={e => updateCondition(c.id, { date: e.target.value || undefined })}
                />
                {promoted ? (
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap px-2">
                    {t('futureback.on_roadmap')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => promoteOne(c)}
                    disabled={!c.text.trim()}
                    className="btn-secondary text-sm whitespace-nowrap"
                  >
                    {t('futureback.push_one')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeCondition(c.id)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => onPatch({ futurebackConditions: [...conditions, createCondition('')] })}
            className="btn-secondary text-sm"
          >
            + {t('futureback.add_condition')}
          </button>
          {conditions.some(c => !isConditionPromoted(c, milestones) && c.text.trim()) && (
            <button type="button" onClick={promoteAll} className="btn-primary text-sm">
              {t('futureback.push_all')}
            </button>
          )}
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => onPatch({ futurebackEnabled: false })}
          className="btn-ghost text-sm"
        >
          {t('futureback.disable')}
        </button>
      </div>
    </div>
  )
}
