import { describe, expect, it } from "vitest";

import { normalizeHebrew, searchTerms } from "./hebrew";

/** Two strings match if they normalise to the same thing. */
function same(a: string, b: string): boolean {
  return normalizeHebrew(a) === normalizeHebrew(b);
}

describe("the ways people write קוטג'", () => {
  it("treats every apostrophe as the same character", () => {
    // Hebrew geresh, ASCII apostrophe, and the curly quote an iPhone inserts.
    expect(same("קוטג׳", "קוטג'")).toBe(true);
    expect(same("קוטג׳", "קוטג’")).toBe(true);
    expect(same("קוטג׳", "קוטג")).toBe(true);
  });

  it("matches a name typed without its apostrophe", () => {
    expect(normalizeHebrew("גבינת קוטג' 5% שומן")).toContain("קוטג");
  });

  it("handles gershayim in abbreviations", () => {
    expect(same('ק"ג', "קג")).toBe(true);
  });
});

describe("final letter forms", () => {
  it("matches a word whether or not the final form was used", () => {
    // A phone keyboard produces the final form; a hurried typist may not.
    expect(same("לחם", "לחמ")).toBe(true);
    expect(same("בורקס עם גבינה", "בורקס עמ גבינה")).toBe(true);
    expect(same("חציל", "חציל")).toBe(true);
  });

  it("normalises every final form", () => {
    expect(same("ך", "כ")).toBe(true);
    expect(same("ם", "מ")).toBe(true);
    expect(same("ן", "נ")).toBe(true);
    expect(same("ף", "פ")).toBe(true);
    expect(same("ץ", "צ")).toBe(true);
  });
});

describe("pointing and punctuation", () => {
  it("ignores niqqud", () => {
    expect(same("לֶחֶם", "לחם")).toBe(true);
  });

  it("keeps a decimal inside a number", () => {
    // Half the Ministry's dairy is named "קוטג' 0.5% שומן". Splitting the
    // decimal made those foods unfindable by their own names.
    expect(normalizeHebrew("0.5%")).toBe("0.5%");
    expect(normalizeHebrew("גבינה 4.5% שומן")).toBe("גבינה 4.5% שומנ");
  });

  it("still separates on a comma between words", () => {
    expect(normalizeHebrew("שומן, תנובה")).toBe("שומנ תנובה");
  });

  it("treats punctuation as a word separator, not a joiner", () => {
    expect(normalizeHebrew("קוטג',תנובה")).toBe("קוטג תנובה");
    expect(normalizeHebrew("פיתה - מלאה")).toBe("פיתה מלאה");
  });

  it("collapses whitespace", () => {
    expect(normalizeHebrew("  גבינת   קוטג׳  ")).toBe("גבינת קוטג");
  });
});

describe("Latin text inside Hebrew", () => {
  it("lowercases so English names match either way", () => {
    expect(same("Cottage Cheese", "cottage cheese")).toBe(true);
  });

  it("leaves digits and percentages findable", () => {
    expect(normalizeHebrew("גבינת קוטג' 5% שומן")).toBe("גבינת קוטג 5% שומנ");
  });
});

describe("search terms", () => {
  it("splits a query into words that must all appear", () => {
    expect(searchTerms("קוטג' תנובה")).toEqual(["קוטג", "תנובה"]);
  });

  it("drops empty terms from sloppy input", () => {
    expect(searchTerms("  פיתה   ")).toEqual(["פיתה"]);
    expect(searchTerms("")).toEqual([]);
  });

  it("survives a name typed exactly as the Ministry stores it", () => {
    expect(searchTerms("גבינת קוטג' 0.5% שומן, תנובה")).toEqual([
      "גבינת",
      "קוטג",
      "0.5%",
      "שומנ",
      "תנובה",
    ]);
  });
});
