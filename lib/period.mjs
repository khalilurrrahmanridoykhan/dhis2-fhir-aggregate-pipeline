// Converts an ISO date/dateTime string into a DHIS2 monthly period code
// ("YYYYMM"), matching the Child Health dataset's Monthly period type.

export function toDhis2MonthlyPeriod(isoDateString) {
  const date = new Date(isoDateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}
