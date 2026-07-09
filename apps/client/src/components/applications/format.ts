// "2026-07-01T00:00:00.000Z" → "2026-07-01"; null → em dash.
export function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : '—';
}

// ISO timestamp → value usable by <input type="date">.
export function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}
