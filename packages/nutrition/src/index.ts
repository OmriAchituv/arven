/**
 * nutrition — bounded context.
 *
 * Owns: Food, Portion, Dish, Entry, Day
 *
 * The domain layer is pure: no Next.js, no Drizzle, no model provider. If a
 * rule about food can be stated without mentioning a database, it belongs here,
 * and it is tested without one.
 */
export * from "./domain/provenance.ts";
export * from "./domain/portion.ts";
export * from "./domain/nutrients.ts";
export * from "./domain/day.ts";
