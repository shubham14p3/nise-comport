/** Inbox calendar dates are shop dates (India), regardless of the viewer's timezone. */
export function inboxToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function inboxDay(offset: number, now = new Date()) {
  const date = new Date(`${inboxToday(now)}T12:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + offset);
  return inboxToday(date);
}
export function inboxDateRange(from: string, to: string, now = new Date()) {
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '2000-01-01' && value <= inboxToday(now) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (!from && !to) return {};
  if (!valid(from) || !valid(to) || from > to) throw new Error('Choose dates from 1 Jan 2000 through today, with From before To.');
  return { from: new Date(`${from}T00:00:00+05:30`), until: new Date(new Date(`${to}T00:00:00+05:30`).getTime() + 86_400_000) };
}
