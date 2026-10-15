/** A date-time with Z or an offset, e.g. "2026-10-16T10:00:00+04:00". Without one, the laptop's timezone would decide. */
export const DATE_TIME_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;
export const DATE_TIME_WITH_OFFSET_MESSAGE =
  '$property must be an ISO 8601 date-time with Z or an offset, e.g. 2026-10-16T10:00:00+04:00';

/** Largest value a Postgres integer column holds. */
export const MAX_INT = 2_147_483_647;
