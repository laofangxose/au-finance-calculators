import { describe, expect, it } from "vitest";
import fy2024Tax from "./tax/brackets/FY2024-25.json";
import fy2025Tax from "./tax/brackets/FY2025-26.json";
import fy2026Tax from "./tax/brackets/FY2026-27.json";
import residuals from "./residuals/ato-car-lease-residuals.json";
import fbtConfig from "./fbt/config.json";

function isSortedByThreshold(
  brackets: Array<{ threshold: number }>,
): boolean {
  for (let i = 1; i < brackets.length; i += 1) {
    if (brackets[i].threshold < brackets[i - 1].threshold) {
      return false;
    }
  }

  return true;
}

describe("AU financial JSON data validation", () => {
  it("keeps tax brackets sorted by threshold for each FY table", () => {
    expect(isSortedByThreshold(fy2024Tax.brackets)).toBe(true);
    expect(isSortedByThreshold(fy2025Tax.brackets)).toBe(true);
    expect(isSortedByThreshold(fy2026Tax.brackets)).toBe(true);
  });

  it("includes residual years 1 to 5", () => {
    const years = Object.keys(residuals.residualPercentByLeaseYear);
    expect(years).toEqual(expect.arrayContaining(["1", "2", "3", "4", "5"]));
  });

  it("keeps FBT statutory rate within 0 and 1", () => {
    expect(fbtConfig.statutoryRate).toBeGreaterThanOrEqual(0);
    expect(fbtConfig.statutoryRate).toBeLessThanOrEqual(1);
  });
});
