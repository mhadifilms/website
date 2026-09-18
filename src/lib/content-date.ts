const isCalendarDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

// A date without a time is an authored calendar day, not an instant to shift
// into the reader's timezone. Timestamped posts retain their local display.
export function formatContentDate(value: string, locale?: string) {
  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(isCalendarDate(value) ? { timeZone: "UTC" } : {}),
  })
}

export function contentYear(value: string) {
  const date = new Date(value)
  return isCalendarDate(value) ? date.getUTCFullYear() : date.getFullYear()
}
