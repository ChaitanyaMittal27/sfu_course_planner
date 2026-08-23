export const TERM_OPTIONS = ["spring", "summer", "fall"] as const;

export type TermName = (typeof TERM_OPTIONS)[number];

const termDigits: Record<TermName, number> = {
  spring: 1,
  summer: 4,
  fall: 7,
};

export function isTermName(term: string): term is TermName {
  return TERM_OPTIONS.includes(term as TermName);
}

export function semesterCode(year: number, term: string): number | null {
  return isTermName(term) ? (year - 1900) * 10 + termDigits[term] : null;
}

export function formatTerm(term: string) {
  return term.charAt(0).toUpperCase() + term.slice(1);
}
