import { getApplication } from '../api/applications';
import type { ApplicationDetail } from '../api/applications';
import { useAsync } from './useAsync';
import type { AsyncState } from './useAsync';

// Load one application (with children) by route param. Shared by the detail
// and edit pages; the detail page uses setData to apply child mutations.
export function useApplication(applicationId: string | undefined): AsyncState<ApplicationDetail> {
  return useAsync(() => {
    if (!applicationId) {
      return Promise.reject(new Error('Application not found.'));
    }
    return getApplication(applicationId);
  }, applicationId);
}
