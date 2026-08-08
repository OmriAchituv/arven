/**
 * Provenance — מקור. Where a number came from, and how sure we are.
 *
 * This is the load-bearing idea of the whole product. Trust comes from
 * provenance, not decimals: a value that was weighed is shown exactly, a value
 * that was guessed is shown as a guess, and ARVEN never renders an estimate in
 * the costume of a measurement.
 *
 * v2 had no such distinction. Every figure looked equally certain, none of them
 * were, and the totals stopped being believable.
 */

export const PROVENANCE_KINDS = [
  /** Someone put it on a scale. */
  "weighed",
  /** A barcode matched a product with declared values. */
  "barcode",
  /** A database's own household measure — "פיתה, יחידה" — at a known weight. */
  "measure",
  /** A quantity nobody measured: חופן, בערך כף, a guessed handful. */
  "estimate",
] as const;

export type ProvenanceKind = (typeof PROVENANCE_KINDS)[number];

export interface Provenance {
  kind: ProvenanceKind;
  /**
   * How far the true weight might plausibly sit from the stated one, as a
   * fraction. 0.3 means "could reasonably be 30% either way".
   *
   * Grounded kinds carry 0. Only estimates carry doubt, and quantifying it is
   * what lets a day report a band instead of a falsely precise total.
   */
  uncertainty: number;
}

/** `●` — the number is grounded and is shown exactly. */
export function isGrounded(provenance: Provenance): boolean {
  return provenance.kind !== "estimate";
}

/** `○` — the number is a guess and is shown as a range. */
export function isEstimated(provenance: Provenance): boolean {
  return !isGrounded(provenance);
}

export const weighed: Provenance = { kind: "weighed", uncertainty: 0 };
export const barcode: Provenance = { kind: "barcode", uncertainty: 0 };
export const measure: Provenance = { kind: "measure", uncertainty: 0 };

/**
 * Default doubt for an unmeasured portion. A quarter either way is honest for
 * "a handful" without being so wide the number stops meaning anything.
 */
export const DEFAULT_ESTIMATE_UNCERTAINTY = 0.25;

export function estimated(
  uncertainty: number = DEFAULT_ESTIMATE_UNCERTAINTY,
): Provenance {
  if (uncertainty < 0 || uncertainty > 1) {
    throw new RangeError(`uncertainty must be between 0 and 1, got ${uncertainty}`);
  }
  return { kind: "estimate", uncertainty };
}

/**
 * The provenance of a whole made of parts — a Dish, or a Day.
 *
 * One estimated component makes the total an estimate. You cannot average away
 * a guess: if any part was guessed, the sum was guessed. The combined
 * uncertainty is weighted by how much each part contributes, so a guessed
 * teaspoon of honey in a large meal barely widens the band, while a guessed
 * main course widens it a lot.
 */
export function combine(
  parts: ReadonlyArray<{ provenance: Provenance; weight: number }>,
): Provenance {
  const total = parts.reduce((sum, part) => sum + part.weight, 0);

  if (total <= 0 || parts.every((part) => isGrounded(part.provenance))) {
    return parts.length > 0 && parts.every((part) => isGrounded(part.provenance))
      ? measure
      : { kind: "measure", uncertainty: 0 };
  }

  const uncertainty = parts.reduce(
    (sum, part) => sum + part.provenance.uncertainty * (part.weight / total),
    0,
  );

  return { kind: "estimate", uncertainty };
}
