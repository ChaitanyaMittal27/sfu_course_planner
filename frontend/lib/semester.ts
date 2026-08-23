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

export function decodeSemesterCode(code: number): { year: number; term: TermName } | null {
  const termDigit = code % 10;
  const term = TERM_OPTIONS.find((option) => termDigits[option] === termDigit);
  return term ? { year: Math.floor(code / 10) + 1900, term } : null;
}

export function formatSemesterCode(code: number) {
  const decoded = decodeSemesterCode(code);
  return decoded ? `${formatTerm(decoded.term)} ${decoded.year}` : `Unknown (${code})`;
}
