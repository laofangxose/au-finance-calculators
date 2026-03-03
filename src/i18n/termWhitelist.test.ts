import { describe, expect, it } from "vitest";
import { preserveWhitelistedTerms } from "./termWhitelist";

describe("preserveWhitelistedTerms", () => {
  it("normalizes ATO casing", () => {
    expect(preserveWhitelistedTerms("See ato guidance.")).toBe("See ATO guidance.");
  });

  it("preserves multi-word whitelist terms", () => {
    expect(
      preserveWhitelistedTerms("estimated tax and medicare levy over the term"),
    ).toBe("estimated tax and Medicare levy over the term");
  });

  it("does not mutate non-token words containing token fragments", () => {
    expect(preserveWhitelistedTerms("every single iceberg stays unchanged")).toBe(
      "every single iceberg stays unchanged",
    );
  });

  it("normalizes gross-up factor casing", () => {
    expect(preserveWhitelistedTerms("gross-up factor applies")).toBe(
      "Gross-up factor applies",
    );
  });
});
