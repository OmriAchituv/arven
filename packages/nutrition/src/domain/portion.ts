import type { Provenance } from "./provenance.ts";
import { estimated, measure, weighed } from "./provenance.ts";

/**
 * Portion — מנת הגשה. How much of a Food, and how we know.
 *
 * Everything reduces to grams, because that is the only thing macros can be
 * computed from. What differs is how the grams were arrived at, which is
 * exactly what Provenance records.
 */
export type Portion =
  /** Someone weighed it. */
  | { kind: "grams"; grams: number }
  /** A household measure the database supplies: 2 × `פרוסה בינונית` at 34 g. */
  | { kind: "measure"; unit: string; gramsPerUnit: number; count: number }
  /** A quantity nobody measured: `חופן`, `בערך כף`. */
  | { kind: "estimate"; label: string; assumedGrams: number; uncertainty?: number };

export interface ResolvedPortion {
  grams: number;
  provenance: Provenance;
  /** How to say it back to the person: `200 ג׳`, `2 × פרוסה בינונית`, `חופן`. */
  label: string;
}

function formatGrams(grams: number): string {
  // Whole grams unless the amount is small enough that a decimal carries
  // information. Nobody wants to read 200.0.
  const rounded = grams < 10 ? Math.round(grams * 10) / 10 : Math.round(grams);
  return `${rounded} ג׳`;
}

/**
 * The single place a Portion becomes grams. Manual entry, natural language and
 * voice all arrive here — new input methods produce Portions, they never
 * compute weights of their own.
 */
export function resolvePortion(portion: Portion): ResolvedPortion {
  switch (portion.kind) {
    case "grams": {
      if (portion.grams <= 0) {
        throw new RangeError(`a portion must weigh something, got ${portion.grams}`);
      }
      return {
        grams: portion.grams,
        provenance: weighed,
        label: formatGrams(portion.grams),
      };
    }

    case "measure": {
      if (portion.count <= 0) {
        throw new RangeError(`a portion must be at least one unit, got ${portion.count}`);
      }
      if (portion.gramsPerUnit <= 0) {
        throw new RangeError(
          `a measure must weigh something, got ${portion.gramsPerUnit}`,
        );
      }
      return {
        grams: portion.gramsPerUnit * portion.count,
        provenance: measure,
        // "פיתה" reads better than "1 × פיתה"; plurals do need the count.
        label: portion.count === 1 ? portion.unit : `${portion.count} × ${portion.unit}`,
      };
    }

    case "estimate": {
      if (portion.assumedGrams <= 0) {
        throw new RangeError(
          `an estimate must assume some weight, got ${portion.assumedGrams}`,
        );
      }
      return {
        grams: portion.assumedGrams,
        provenance: estimated(portion.uncertainty),
        label: portion.label,
      };
    }
  }
}

/**
 * Turning an estimate into a measurement — the `○ → ●` upgrade.
 *
 * Offered by the interface whenever an estimate is shown, and never demanded.
 * Honesty has to feel rewarded, or the log stops reflecting what was eaten.
 */
export function weigh(grams: number): Portion {
  return { kind: "grams", grams };
}
