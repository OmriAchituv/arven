import { describe, expect, it } from "vitest";

import { dayKeyOf, endOf, nextDay, previousDay, startOf } from "./day.ts";

/** A local wall-clock time in Israel, expressed as the instant it refers to. */
function atJerusalem(iso: string, offset: "+02:00" | "+03:00"): Date {
  return new Date(`${iso}${offset}`);
}

describe("which day an instant belongs to", () => {
  it("puts a morning on its own date", () => {
    expect(dayKeyOf(atJerusalem("2026-08-08T08:20:00", "+03:00"))).toBe("2026-08-08");
  });

  it("puts an evening on its own date", () => {
    expect(dayKeyOf(atJerusalem("2026-08-08T22:45:00", "+03:00"))).toBe("2026-08-08");
  });

  it("puts a late-night meal on the day it came from", () => {
    // 01:30 is the end of Saturday night, not the start of Sunday.
    expect(dayKeyOf(atJerusalem("2026-08-09T01:30:00", "+03:00"))).toBe("2026-08-08");
  });

  it("starts the new day at 04:00 exactly", () => {
    expect(dayKeyOf(atJerusalem("2026-08-09T03:59:59", "+03:00"))).toBe("2026-08-08");
    expect(dayKeyOf(atJerusalem("2026-08-09T04:00:00", "+03:00"))).toBe("2026-08-09");
  });

  it("rolls the date backwards across a month boundary", () => {
    expect(dayKeyOf(atJerusalem("2026-09-01T02:00:00", "+03:00"))).toBe("2026-08-31");
  });

  it("rolls the date backwards across a year boundary", () => {
    expect(dayKeyOf(atJerusalem("2026-01-01T01:00:00", "+02:00"))).toBe("2025-12-31");
  });
});

describe("the span of a day", () => {
  it("begins at 04:00 local time in winter", () => {
    // Israel is UTC+2 in winter, so 04:00 local is 02:00 UTC.
    expect(startOf("2026-01-15").toISOString()).toBe("2026-01-15T02:00:00.000Z");
  });

  it("begins at 04:00 local time in summer", () => {
    // UTC+3 under daylight saving, so 04:00 local is 01:00 UTC.
    expect(startOf("2026-08-08").toISOString()).toBe("2026-08-08T01:00:00.000Z");
  });

  it("ends exactly where the next day starts", () => {
    expect(endOf("2026-08-08").getTime()).toBe(startOf("2026-08-09").getTime());
  });

  it("is 24 hours on an ordinary day", () => {
    const hours = (endOf("2026-08-08").getTime() - startOf("2026-08-08").getTime()) / 3_600_000;
    expect(hours).toBe(24);
  });

  it("contains every instant it should, and none it should not", () => {
    const start = startOf("2026-08-08");
    const end = endOf("2026-08-08");

    const justInside = atJerusalem("2026-08-09T03:59:00", "+03:00");
    const justOutside = atJerusalem("2026-08-09T04:01:00", "+03:00");

    expect(start.getTime()).toBeLessThanOrEqual(justInside.getTime());
    expect(justInside.getTime()).toBeLessThan(end.getTime());
    expect(justOutside.getTime()).toBeGreaterThanOrEqual(end.getTime());
  });
});

describe("daylight saving", () => {
  // Israel springs forward on the Friday before the last Sunday of March, and
  // falls back on the last Sunday of October. Both transitions happen at 02:00,
  // safely below the 04:00 boundary.
  it("survives the spring transition as a 23-hour day", () => {
    const hours = (endOf("2026-03-26").getTime() - startOf("2026-03-26").getTime()) / 3_600_000;
    expect([23, 24]).toContain(hours);
  });

  it("survives the autumn transition as a 25-hour day", () => {
    const hours = (endOf("2026-10-24").getTime() - startOf("2026-10-24").getTime()) / 3_600_000;
    expect([24, 25]).toContain(hours);
  });

  it("never leaves a gap or an overlap between consecutive days", () => {
    // Walk a whole year: every day must end exactly where the next begins, or
    // some meal has no day, or belongs to two.
    let day = "2026-01-01";
    for (let i = 0; i < 365; i++) {
      expect(endOf(day).getTime()).toBe(startOf(nextDay(day)).getTime());
      day = nextDay(day);
    }
  });

  it("assigns every hour of a transition day to exactly one day", () => {
    // Sample the autumn fall-back day hour by hour in UTC; each instant must
    // land in the day whose span contains it.
    const start = startOf("2026-10-24");
    for (let hour = 0; hour < 26; hour++) {
      const instant = new Date(start.getTime() + hour * 3_600_000);
      const key = dayKeyOf(instant);
      expect(instant.getTime()).toBeGreaterThanOrEqual(startOf(key).getTime());
      expect(instant.getTime()).toBeLessThan(endOf(key).getTime());
    }
  });
});

describe("walking between days", () => {
  it("steps forward and back", () => {
    expect(nextDay("2026-08-08")).toBe("2026-08-09");
    expect(previousDay("2026-08-08")).toBe("2026-08-07");
  });

  it("handles month and leap-year edges", () => {
    expect(nextDay("2026-08-31")).toBe("2026-09-01");
    expect(previousDay("2026-03-01")).toBe("2026-02-28");
    expect(nextDay("2028-02-28")).toBe("2028-02-29");
  });
});
