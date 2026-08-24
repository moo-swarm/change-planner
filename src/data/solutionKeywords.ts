/**
 * Solution-noun heuristics for the future-back lint guard (AC6.2).
 *
 * These are CODE DATA, not i18n strings (UX decision 5): matched words render
 * verbatim from the user's own statement; only the surrounding banner sentence
 * is translated. Seeded EN + RU from the source-article vocabulary; locales
 * without a dedicated list fall back (es→en, be→ru) — see pickKeywordList.
 * Single tokens only: the matcher compares whole whitespace-separated words
 * (hyphenated compounds count as one token), so multi-word phrases never match.
 */
export const SOLUTION_KEYWORDS: { en: string[]; ru: string[] } = {
  en: [
    'jira',
    'confluence',
    'slack',
    'github',
    'gitlab',
    'kubernetes',
    'docker',
    'migrate',
    'migration',
    'deploy',
    'implement',
    'implementation',
    'microservices',
    'rewrite',
    'refactor',
  ],
  ru: [
    'джира',
    'конфлюенс',
    'слак',
    'гитхаб',
    'кубернетес',
    'докер',
    'мигрировать',
    'миграция',
    'задеплоить',
    'внедрить',
    'внедрение',
    'микросервисы',
    'переписать',
    'рефакторинг',
  ],
}

/** Locales with a dedicated list get it; others fall back (es→en, be→ru). */
export function pickKeywordList(locale: string): string[] {
  if (locale === 'ru' || locale === 'be') return SOLUTION_KEYWORDS.ru
  return SOLUTION_KEYWORDS.en
}
