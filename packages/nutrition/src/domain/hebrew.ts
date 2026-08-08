/**
 * Hebrew normalisation for search.
 *
 * People do not type the way a database stores. `קוטג'` is written with an
 * apostrophe, a geresh, or nothing at all; `בורקס` gets typed without its final
 * letter form; niqqud appears in copied text and never in typing. Matching has
 * to survive all of it.
 *
 * This is string work, deliberately — no model is involved in finding food.
 * A language model that guessed at spelling would be slower, cost money, and
 * be wrong in ways nobody could debug.
 */

/** Final letter forms map to their ordinary counterparts. */
const FINAL_FORMS: Record<string, string> = {
  "ך": "כ", // ך → כ
  "ם": "מ", // ם → מ
  "ן": "נ", // ן → נ
  "ף": "פ", // ף → פ
  "ץ": "צ", // ץ → צ
};

/**
 * Everything used as a geresh or gershayim in the wild: the Hebrew punctuation
 * marks, the ASCII typewriter marks, and the typographic quotes an iPhone
 * substitutes automatically.
 */
const QUOTE_LIKE = /[׳״'"‘’“”`´]/g;

/** Niqqud, cantillation and the maqaf. */
const POINTING = /[֑-ׇ]/g;

/**
 * Reduce a name or a query to the form both are compared in.
 *
 * Applied to the query at search time and to every food name at import time,
 * so the two always meet in the same shape.
 */
export function normalizeHebrew(input: string): string {
  let text = input.normalize("NFKD").replace(POINTING, "").replace(QUOTE_LIKE, "");

  text = text.replace(/[ךםןףץ]/g, (ch) => FINAL_FORMS[ch] ?? ch);

  return (
    text
      .toLowerCase()
      // Punctuation separates words rather than joining them: "קוטג',תנובה"
      // should find "קוטג' תנובה".
      .replace(/[;:!?()[\]{}\-–—/\\|]+/g, " ")
      // A dot or comma between digits is part of a number, not a separator.
      // Half the Ministry's dairy is named things like "קוטג' 0.5% שומן", and
      // splitting that into "0" and "5%" makes the food unfindable by its own
      // name.
      .replace(/(?<!\d)[.,]|[.,](?!\d)/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** The words a query is looking for. Every one of them has to appear. */
export function searchTerms(query: string): string[] {
  return normalizeHebrew(query).split(" ").filter((term) => term.length > 0);
}
