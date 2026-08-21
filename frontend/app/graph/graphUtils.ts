export function formatSemester(code: number): string {
  const codeStr = code.toString();

  // Extract year: first 3 digits + 1900
  const year = 1900 + parseInt(codeStr.substring(0, 3));

  // Extract term: last digit
  const termCode = codeStr.charAt(3);

  const term = termCode === "1" ? "Spring" : termCode === "4" ? "Summer" : termCode === "7" ? "Fall" : "Unknown";

  return `${term} ${year}`;
}

export function getLoadColor(load: number): string {
  if (load <= 80) return "#16A34A"; // green - comfortable
  if (load <= 90) return "#F59E0B"; // amber - getting full
  return "#DC2626"; // red - at capacity
}

export function getLoadLabel(load: number): string {
  if (load <= 80) return "Comfortable";
  if (load <= 90) return "Getting Full";
  return "At Capacity";
}
