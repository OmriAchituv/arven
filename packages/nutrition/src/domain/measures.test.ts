import { describe, expect, it } from "vitest";

import {
  ROUGHLY_UNCERTAINTY,
  SIZE_JUDGEMENT_UNCERTAINTY,
  approximateLabel,
  isSizeJudgement,
  uncertaintyFor,
} from "./measures";

describe("counting a thing is not judging a size", () => {
  it("treats discrete objects and vessels as grounded", () => {
    // Every one of these is a real measure name from the Ministry's data.
    for (const unit of ["יחידה", "גביע", "כוס", "כף", "כפית", "אריזה", "בקבוק", "פרוסה", "ספל"]) {
      expect(isSizeJudgement(unit)).toBe(false);
    }
  });

  it("treats a size qualifier as a judgement", () => {
    for (const unit of [
      "מנה קטנה",
      "מנה בינונית",
      "מנה גדולה",
      "יחידה קטנה",
      "יחידה גדולה",
      "פרוסה דקה",
      "פרוסה עבה",
      "יחידה  קטנה מאד",
    ]) {
      expect(isSizeJudgement(unit)).toBe(true);
    }
  });

  it("does not mistake a heaped or level spoon for a size judgement", () => {
    // These sharpen a measure rather than guess at one.
    expect(isSizeJudgement("כף גדושה")).toBe(false);
    expect(isSizeJudgement("כף שטוחה")).toBe(false);
    expect(isSizeJudgement("כפית שטוחה")).toBe(false);
  });

  it("matches regardless of how the name is spaced", () => {
    expect(isSizeJudgement("יחידה  קטנה  מאד")).toBe(true);
  });
});

describe("how sure we can be", () => {
  it("is certain about counting a thing", () => {
    expect(uncertaintyFor("גביע", false)).toBeNull();
    expect(uncertaintyFor("כף", false)).toBeNull();
  });

  it("carries doubt about a judged size", () => {
    expect(uncertaintyFor("מנה בינונית", false)).toBe(SIZE_JUDGEMENT_UNCERTAINTY);
  });

  it("carries more doubt when someone says it was approximate", () => {
    expect(uncertaintyFor("כף", true)).toBe(ROUGHLY_UNCERTAINTY);
    expect(ROUGHLY_UNCERTAINTY).toBeGreaterThan(SIZE_JUDGEMENT_UNCERTAINTY);
  });

  it("lets 'roughly' override an already-judged size rather than compounding", () => {
    // "Roughly a large portion" is one admission of vagueness, not two.
    expect(uncertaintyFor("מנה גדולה", true)).toBe(ROUGHLY_UNCERTAINTY);
  });
});

describe("saying it back", () => {
  it("prefixes an approximate measure", () => {
    expect(approximateLabel("כף", 1)).toBe("בערך כף");
  });

  it("keeps the count when there was more than one", () => {
    expect(approximateLabel("כף", 2)).toBe("בערך 2 × כף");
  });
});
