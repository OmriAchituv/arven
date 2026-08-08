/**
 * Day — יום. Everything eaten between 04:00 and 04:00, Asia/Jerusalem.
 *
 * Calendar midnight is the wrong boundary for food. Eating at 01:30 is the end
 * of a long evening, not the start of a morning, and filing it under the new
 * date pollutes tomorrow's total before you have had breakfast.
 *
 * Israel observes daylight saving, so this is computed through the IANA zone
 * rather than by adding a fixed offset — there is one 23-hour day and one
 * 25-hour day each year, and offset arithmetic gets both wrong. The transitions
 * happen at 02:00, which is another reason 04:00 is a good boundary: it never
 * lands in a skipped or repeated hour.
 */

export const ZONE = "Asia/Jerusalem";

/** The hour a new Day begins, in local time. */
export const DAY_STARTS_AT_HOUR = 4;

/** A calendar date in the local zone, `YYYY-MM-DD`. Identifies one Day. */
export type DayKey = string;

const FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function localParts(instant: Date): LocalParts {
  const parts = FORMATTER.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value ?? "0";
    return Number(value);
  };

  return {
    year: get("year"),
    month: get("month"),
    // `hour12: false` yields 24 for midnight in some runtimes.
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

function toKey(year: number, month: number, day: number): DayKey {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/**
 * Which Day an instant belongs to.
 *
 * Anything before 04:00 belongs to the day before — the evening it actually
 * came from.
 */
export function dayKeyOf(instant: Date): DayKey {
  const local = localParts(instant);

  if (local.hour >= DAY_STARTS_AT_HOUR) {
    return toKey(local.year, local.month, local.day);
  }

  // Step back a calendar day using UTC arithmetic on the *local* date, which is
  // safe because it is plain date maths with no zone involved.
  const previous = new Date(Date.UTC(local.year, local.month - 1, local.day));
  previous.setUTCDate(previous.getUTCDate() - 1);

  return toKey(
    previous.getUTCFullYear(),
    previous.getUTCMonth() + 1,
    previous.getUTCDate(),
  );
}

/** How far the zone is ahead of UTC at a given instant, in milliseconds. */
function zoneOffsetMs(instant: Date): number {
  const local = localParts(instant);
  const asIfUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  );
  return asIfUtc - instant.getTime();
}

/**
 * The instant a Day begins.
 *
 * Converting a local wall time to an instant needs the offset in force *at that
 * instant*, which is circular — so guess with the offset nearby, then correct
 * once. One correction is enough: offsets shift by an hour, never by enough to
 * move the answer past another transition.
 */
export function startOf(day: DayKey): Date {
  const [year, month, date] = day.split("-").map(Number) as [number, number, number];
  const wallClock = Date.UTC(year, month - 1, date, DAY_STARTS_AT_HOUR);

  const guess = new Date(wallClock - zoneOffsetMs(new Date(wallClock)));
  return new Date(wallClock - zoneOffsetMs(guess));
}

/** The instant a Day ends — exclusive, and equal to the next Day's start. */
export function endOf(day: DayKey): Date {
  return startOf(nextDay(day));
}

export function nextDay(day: DayKey): DayKey {
  const [year, month, date] = day.split("-").map(Number) as [number, number, number];
  const next = new Date(Date.UTC(year, month - 1, date));
  next.setUTCDate(next.getUTCDate() + 1);
  return toKey(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

export function previousDay(day: DayKey): DayKey {
  const [year, month, date] = day.split("-").map(Number) as [number, number, number];
  const previous = new Date(Date.UTC(year, month - 1, date));
  previous.setUTCDate(previous.getUTCDate() - 1);
  return toKey(
    previous.getUTCFullYear(),
    previous.getUTCMonth() + 1,
    previous.getUTCDate(),
  );
}
