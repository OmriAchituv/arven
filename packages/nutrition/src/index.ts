/**
 * nutrition — bounded context.
 *
 * Owns: Food, Portion, Dish, Entry, Day
 *
 * The domain layer is pure: no Next.js, no Drizzle, no model provider. If a
 * rule about food can be stated without mentioning a database, it belongs here,
 * and it is tested without one.
 */
export * from "./domain/provenance";
export * from "./domain/portion";
export * from "./domain/nutrients";
export * from "./domain/day";
export * from "./domain/hebrew";
export * from "./infra/foods";
export * from "./domain/logged-day";
export * from "./app/index";
export * from "./infra/entries";
export * from "./domain/measures";
export * from "./infra/personal-foods";
