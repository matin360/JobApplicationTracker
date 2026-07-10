import { buildApiUrl } from './http';
import type { ApplicationStatus } from './applications';

export interface ExportFilters {
  statuses?: ApplicationStatus[];
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

// Download the user's applications as CSV, honoring the given filters.
// Fetches with credentials (so the session cookie is sent), then triggers the
// browser's save dialog by clicking a temporary object-URL anchor — fetch alone
// cannot start a download, and a plain <a href> would not carry error handling.
export async function downloadApplicationsCsv(filters: ExportFilters = {}): Promise<void> {
  const params = new URLSearchParams();
  if (filters.statuses && filters.statuses.length > 0) {
    params.set('status', filters.statuses.join(','));
  }
  if (filters.from) {
    params.set('from', filters.from);
  }
  if (filters.to) {
    params.set('to', filters.to);
  }

  const query = params.toString();
  const response = await fetch(buildApiUrl(`/api/applications/export${query ? `?${query}` : ''}`), {
    credentials: 'include'
  });

  if (!response.ok) {
    let message = `Export failed. (${response.status} ${response.statusText})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Non-JSON error body; keep the status message.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'applications.csv';

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
