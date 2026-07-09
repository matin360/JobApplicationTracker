// "2026-07-01T00:00:00.000Z" → "2026-07-01"; null → em dash.
export function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : '—';
}

// ISO timestamp → value usable by <input type="date">.
export function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

// ISO timestamp → "YYYY-MM-DD HH:MM" in local time; null → em dash.
export function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ISO timestamp → value usable by <input type="datetime-local">.
export function toDateTimeInputValue(value: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
