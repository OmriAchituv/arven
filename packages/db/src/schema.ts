import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Small key/value table for facts about the deployment itself — never product data.
 *
 * It exists in the walking skeleton to prove the whole path end to end: a migration
 * ran, a row is there, and the app can read it through Drizzle over the Neon driver.
 * It stays useful afterwards, recording which food-data import a database is carrying.
 */
export const meta = pgTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Meta = typeof meta.$inferSelect;

/**
 * Where a Food's numbers came from. Ordered by how it ranks in search: your own
 * items first, then the Israeli Ministry of Health, then USDA as a fallback, then
 * barcode lookups cached from Open Food Facts.
 *
 * This is not the same thing as an Entry's provenance. A Food describes a
 * substance; provenance describes how confident we are about a particular
 * quantity of it that someone actually ate.
 */
export const FOOD_SOURCES = ["personal", "moh", "usda", "off"] as const;
export type FoodSource = (typeof FOOD_SOURCES)[number];

/**
 * A Food — מזון. One item, with values per 100 g.
 *
 * Only the figures the product actually shows are stored. The MoH set carries 74
 * nutrients per item; the rest can be added later by re-running the import, which
 * is idempotent, so there is no reason to carry them before anything reads them.
 */
export const foods = pgTable(
  "foods",
  {
    id: text("id").primaryKey(),

    source: text("source").$type<FoodSource>().notNull(),
    /** The identifier this food carries in its source. `products.Code` for MoH. */
    sourceId: text("source_id"),

    name: text("name").notNull(),
    nameEn: text("name_en"),

    /**
     * `name` reduced to the form queries are compared against — no geresh, no
     * final letter forms, no niqqud. Written at import time by the same
     * function the query goes through, so the two always meet in one shape.
     */
    searchName: text("search_name").notNull(),

    kcalPer100g: doublePrecision("kcal_per_100g").notNull(),
    proteinPer100g: doublePrecision("protein_per_100g").notNull(),
    carbsPer100g: doublePrecision("carbs_per_100g").notNull(),
    fatPer100g: doublePrecision("fat_per_100g").notNull(),

    fiberPer100g: doublePrecision("fiber_per_100g"),
    sugarsPer100g: doublePrecision("sugars_per_100g"),
    sodiumPer100g: doublePrecision("sodium_per_100g"),

    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("foods_source_source_id_idx").on(table.source, table.sourceId),
    index("foods_search_name_idx").on(table.searchName),
  ],
);

export type Food = typeof foods.$inferSelect;
export type NewFood = typeof foods.$inferInsert;

/**
 * A household measure for one Food — כף, פרוסה בינונית, גביע — and what it weighs.
 *
 * This table is why logging can be both fast and grounded without a language
 * model: "פיתה אחת" becomes 100 g by lookup. The MoH set supplies roughly four
 * per product, and they are specific — challah has three slice thicknesses.
 */
export const portionUnits = pgTable(
  "portion_units",
  {
    id: text("id").primaryKey(),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),

    /** As a person would say it: `כף`, `גביע`, `פרוסה עבה`. */
    name: text("name").notNull(),
    grams: doublePrecision("grams").notNull(),

    /**
     * Ordering within a food's picker. Lower sorts first, so the measure someone
     * is most likely to mean is offered before the unusual ones.
     */
    rank: integer("rank").notNull().default(0),
  },
  (table) => [
    uniqueIndex("portion_units_food_name_idx").on(table.foodId, table.name),
    index("portion_units_food_idx").on(table.foodId),
  ],
);

export type PortionUnit = typeof portionUnits.$inferSelect;
export type NewPortionUnit = typeof portionUnits.$inferInsert;

/**
 * An Entry — רישום. One act of eating, at a time.
 *
 * The columns mirror the domain's `Portion` union exactly, one group per
 * variant, rather than overloading a single `amount`. Verbose on purpose: a
 * shape that maps one-to-one onto the type it stores cannot drift away from it
 * quietly.
 *
 * Note what is absent: no calories, no macros, no day. All three are derived —
 * from the food's per-100g values, the portion, and the eaten-at instant. v2
 * stored running totals on a day row and had to keep them in step by hand.
 */
export const entries = pgTable(
  "entries",
  {
    id: text("id").primaryKey(),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id),

    eatenAt: timestamp("eaten_at", { withTimezone: true }).notNull(),

    /** 'grams' | 'measure' | 'estimate' — the domain's Portion variants. */
    portionKind: text("portion_kind").$type<PortionKind>().notNull(),

    /** kind = 'grams' */
    grams: doublePrecision("grams"),

    /** kind = 'measure' — a household measure the database supplied. */
    unitName: text("unit_name"),
    unitGrams: doublePrecision("unit_grams"),
    unitCount: doublePrecision("unit_count"),

    /** kind = 'estimate' — a quantity nobody measured. */
    estimateLabel: text("estimate_label"),
    estimateGrams: doublePrecision("estimate_grams"),
    estimateUncertainty: doublePrecision("estimate_uncertainty"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("entries_eaten_at_idx").on(table.eatenAt)],
);

export const PORTION_KINDS = ["grams", "measure", "estimate"] as const;
export type PortionKind = (typeof PORTION_KINDS)[number];

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
