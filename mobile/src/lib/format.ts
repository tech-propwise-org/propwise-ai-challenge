/** Shows a time in the agent's timezone, not the phone's: "16 Oct, 10:30". */
export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatAed(amount: number): string {
  return `AED ${new Intl.NumberFormat('en-US').format(amount)}`;
}
