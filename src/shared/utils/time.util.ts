export function startOfDay(date: string, tzSuffix = '+08:00'): Date {
  return new Date(`${date}T00:00:00.000${tzSuffix}`);
}
export function endOfDay(date: string, tzSuffix = '+08:00'): Date {
  return new Date(`${date}T23:59:59.999${tzSuffix}`);
}
