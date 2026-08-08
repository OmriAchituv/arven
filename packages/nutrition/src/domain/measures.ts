import { normalizeHebrew } from "./hebrew";

/**
 * Which of the Ministry's own measures are judgements rather than measurements.
 *
 * `גביע` is a tub — one of them is one of them. `מנה בינונית` is you deciding
 * your portion was medium-sized. Both come with a gram weight attached, but only
 * the first is a fact about the food; the second is a fact about your estimate
 * of it.
 *
 * This is where `○` comes from without inventing vocabulary. Roughly a third of
 * the 9,855 measures carry a size qualifier, so the distinction is already in
 * the data — it just had to be noticed.
 */

/** Words that turn a measure into a judgement about which size you had. */
const SIZE_QUALIFIERS = [
  "קטנה",
  "קטן",
  "בינונית",
  "בינוני",
  "גדולה",
  "גדול",
  "דקה",
  "דק",
  "עבה",
  "מאד",
  "מאוד",
];

/**
 * Doubt in a size judgement. A quarter either way is honest for "I think that
 * was a medium one" without being so wide the number stops meaning anything.
 */
export const SIZE_JUDGEMENT_UNCERTAINTY = 0.2;

/**
 * Doubt when someone says a measure was approximate — "בערך כף". Wider than a
 * size judgement, because it admits to not having measured at all.
 */
export const ROUGHLY_UNCERTAINTY = 0.25;

/**
 * True when choosing this measure means judging a size rather than counting a
 * thing.
 */
export function isSizeJudgement(unitName: string): boolean {
  const words = normalizeHebrew(unitName).split(" ");
  return words.some((word) => SIZE_QUALIFIERS.includes(word));
}

/**
 * How sure we can be about a portion expressed in this measure, given whether
 * the person also said it was approximate.
 *
 * `null` means grounded — the value is shown exactly.
 */
export function uncertaintyFor(unitName: string, roughly: boolean): number | null {
  if (roughly) return ROUGHLY_UNCERTAINTY;
  return isSizeJudgement(unitName) ? SIZE_JUDGEMENT_UNCERTAINTY : null;
}

/** How ARVEN says an approximate measure back: `בערך כף`. */
export function approximateLabel(unitName: string, count: number): string {
  const measure = count === 1 ? unitName : `${count} × ${unitName}`;
  return `בערך ${measure}`;
}
