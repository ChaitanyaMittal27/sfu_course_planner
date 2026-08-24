import { describe, expect, it } from "vitest";
import { decodeSemesterCode, formatSemesterCode, semesterCode } from "@/lib/semester";

describe("semester utilities", () => {
  it("round-trips SFU spring, summer, and fall terms", () => {
    expect(semesterCode(2026, "spring")).toBe(1261);
    expect(semesterCode(2026, "summer")).toBe(1264);
    expect(semesterCode(2026, "fall")).toBe(1267);
    expect(decodeSemesterCode(1267)).toEqual({ year: 2026, term: "fall" });
  });

  it("rejects invalid terms and semester-code digits", () => {
    expect(semesterCode(2026, "winter")).toBeNull();
    expect(decodeSemesterCode(1260)).toBeNull();
    expect(formatSemesterCode(1260)).toBe("Unknown (1260)");
  });
});
