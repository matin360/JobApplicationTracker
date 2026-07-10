import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ApplicationsPage from '../src/pages/ApplicationsPage';
import ApplicationDetailPage from '../src/pages/ApplicationDetailPage';
import NewApplicationPage from '../src/pages/NewApplicationPage';
import EditApplicationPage from '../src/pages/EditApplicationPage';
import * as applications from '../src/api/applications';
import * as exportApi from '../src/api/export';
import type { ApplicationDetail } from '../src/api/applications';

vi.mock('../src/api/applications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/api/applications')>()),
  listApplications: vi.fn(),
  getApplication: vi.fn(),
  createApplication: vi.fn(),
  updateApplication: vi.fn(),
  deleteApplication: vi.fn()
}));

vi.mock('../src/api/export', () => ({
  downloadApplicationsCsv: vi.fn()
}));

const mocked = {
  ...(applications as unknown as Record<
    'listApplications' | 'getApplication' | 'createApplication' | 'updateApplication' | 'deleteApplication',
    ReturnType<typeof vi.fn>
  >),
  downloadApplicationsCsv: exportApi.downloadApplicationsCsv as unknown as ReturnType<typeof vi.fn>
};

function makeRecord(overrides: Partial<ApplicationDetail>): ApplicationDetail {
  return {
    id: 'app-1',
    company: { id: 'c1', name: 'Acme Corp' },
    roleTitle: 'Frontend Engineer',
    location: 'Remote',
    source: 'LinkedIn',
    status: 'applied',
    appliedAt: '2026-07-01T00:00:00.000Z',
    jobUrl: 'https://acme.example.com/jobs/1',
    priority: 'high',
    nextFollowUpAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    notes: [],
    reminders: [],
    interviews: [],
    ...overrides
  };
}

const sampleRecords = [
  makeRecord({ id: 'a1', roleTitle: 'Frontend Engineer', company: { id: 'c1', name: 'Acme' }, status: 'applied' }),
  makeRecord({ id: 'a2', roleTitle: 'Backend Engineer', company: { id: 'c2', name: 'Globex' }, status: 'offer' }),
  makeRecord({ id: 'a3', roleTitle: 'Designer', company: null, status: 'rejected' })
];

describe('ApplicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.listApplications.mockResolvedValue(sampleRecords);
  });

  const renderList = () =>
    render(
      <MemoryRouter initialEntries={['/applications']}>
        <Routes>
          <Route path="/applications" element={<ApplicationsPage />} />
        </Routes>
      </MemoryRouter>
    );

  it('renders fetched applications with links to detail pages', async () => {
    renderList();

    expect(await screen.findByRole('cell', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Backend Engineer' })).toHaveAttribute('href', '/applications/a2');
  });

  it('filters by search text', async () => {
    renderList();
    await screen.findByRole('cell', { name: 'Acme' });

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'globex' } });

    expect(screen.getByRole('cell', { name: 'Globex' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Acme' })).not.toBeInTheDocument();
  });

  it('filters by status', async () => {
    renderList();
    await screen.findByRole('cell', { name: 'Acme' });

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'rejected' } });

    expect(screen.getByRole('cell', { name: 'Designer' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Frontend Engineer' })).not.toBeInTheDocument();
  });

  it('exports a CSV using the current filters', async () => {
    let resolveExport!: () => void;

    type ExportFn = () => Promise<void>;

    const exportMock = mocked.downloadApplicationsCsv as ReturnType<typeof vi.fn> & {
      mockImplementation(fn: ExportFn): void;
    };

    exportMock.mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveExport = resolve;
      });
    });

    renderList();
    await screen.findByRole('cell', { name: 'Acme' });

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'offer' } });
    fireEvent.change(screen.getByLabelText('Applied from'), { target: { value: '2026-06-01' } });

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() =>
      expect(mocked.downloadApplicationsCsv).toHaveBeenCalledWith({
        statuses: ['offer'],
        from: '2026-06-01',
        to: undefined
      })
    );

    // Loading state while the download is in flight.
    const busyButton = screen.getByRole('button', { name: 'Exporting…' });
    expect(busyButton).toBeDisabled();

    resolveExport();
    expect(await screen.findByRole('button', { name: 'Export CSV' })).toBeEnabled();
  });

  it('shows an error when the export fails', async () => {
    mocked.downloadApplicationsCsv.mockRejectedValue(new Error('Export failed. (500 Internal Server Error)'));

    renderList();
    await screen.findByRole('cell', { name: 'Acme' });

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(await screen.findByText('Export failed. (500 Internal Server Error)')).toBeInTheDocument();
  });

  it('sorts by role when the header is clicked', async () => {
    renderList();
    await screen.findByRole('cell', { name: 'Acme' });

    fireEvent.click(screen.getByRole('button', { name: 'Role' }));

    const cells = screen.getAllByRole('link', { name: /Engineer|Designer/ });
    expect(cells[0]).toHaveTextContent('Backend Engineer');

    fireEvent.click(screen.getByRole('button', { name: /Role/ }));
    const reversed = screen.getAllByRole('link', { name: /Engineer|Designer/ });
    expect(reversed[0]).toHaveTextContent('Frontend Engineer');
  });
});

describe('NewApplicationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderNew = () =>
    render(
      <MemoryRouter initialEntries={['/applications/new']}>
        <Routes>
          <Route path="/applications/new" element={<NewApplicationPage />} />
          <Route path="/applications/:applicationId" element={<p>Detail marker</p>} />
        </Routes>
      </MemoryRouter>
    );

  it('validates that role title is required', async () => {
    renderNew();

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Role title is required.')).toBeInTheDocument();
    expect(mocked.createApplication).not.toHaveBeenCalled();
  });

  it('validates the job URL', async () => {
    renderNew();

    fireEvent.change(screen.getByLabelText('Role title'), { target: { value: 'Engineer' } });
    fireEvent.change(screen.getByLabelText('Job URL'), { target: { value: 'not-a-url' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Job URL must be a valid http(s) URL.')).toBeInTheDocument();
    expect(mocked.createApplication).not.toHaveBeenCalled();
  });

  it('creates the application and navigates to its detail page', async () => {
    mocked.createApplication.mockResolvedValue(makeRecord({ id: 'created-1' }));

    renderNew();

    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText('Role title'), { target: { value: 'Engineer' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'applied' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(mocked.createApplication).toHaveBeenCalledWith(
        expect.objectContaining({ company: 'Acme', roleTitle: 'Engineer', status: 'applied' })
      )
    );
    expect(await screen.findByText('Detail marker')).toBeInTheDocument();
  });

  it('shows the server error when creation fails', async () => {
    mocked.createApplication.mockRejectedValue(new Error('Status must be one of: saved, applied.'));

    renderNew();

    fireEvent.change(screen.getByLabelText('Role title'), { target: { value: 'Engineer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Status must be one of: saved, applied.')).toBeInTheDocument();
  });
});

describe('ApplicationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getApplication.mockResolvedValue(makeRecord({ id: 'a1' }));
  });

  const renderDetail = () =>
    render(
      <MemoryRouter initialEntries={['/applications/a1']}>
        <Routes>
          <Route path="/applications/:applicationId" element={<ApplicationDetailPage />} />
          <Route path="/applications" element={<p>List marker</p>} />
        </Routes>
      </MemoryRouter>
    );

  it('renders the application details', async () => {
    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Frontend Engineer' })).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://acme.example.com/jobs/1' })).toBeInTheDocument();
  });

  it('requires confirmation before deleting, then navigates back to the list', async () => {
    mocked.deleteApplication.mockResolvedValue(undefined);

    renderDetail();
    await screen.findByRole('heading', { name: 'Frontend Engineer' });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(mocked.deleteApplication).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() => expect(mocked.deleteApplication).toHaveBeenCalledWith('a1'));
    expect(await screen.findByText('List marker')).toBeInTheDocument();
  });

  it('can cancel the delete confirmation', async () => {
    renderDetail();
    await screen.findByRole('heading', { name: 'Frontend Engineer' });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(mocked.deleteApplication).not.toHaveBeenCalled();
  });

  it('shows an error when the application cannot be loaded', async () => {
    mocked.getApplication.mockRejectedValue(new Error('Not found'));

    renderDetail();

    expect(await screen.findByText('Not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to applications' })).toBeInTheDocument();
  });
});

describe('EditApplicationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.getApplication.mockResolvedValue(makeRecord({ id: 'a1' }));
  });

  const renderEdit = () =>
    render(
      <MemoryRouter initialEntries={['/applications/a1/edit']}>
        <Routes>
          <Route path="/applications/:applicationId/edit" element={<EditApplicationPage />} />
          <Route path="/applications/:applicationId" element={<p>Detail marker</p>} />
        </Routes>
      </MemoryRouter>
    );

  it('prefills the form with existing data and saves changes', async () => {
    mocked.updateApplication.mockResolvedValue(makeRecord({ id: 'a1', status: 'offer' }));

    renderEdit();

    const roleInput = await screen.findByLabelText('Role title');
    expect(roleInput).toHaveValue('Frontend Engineer');
    expect(screen.getByLabelText('Company')).toHaveValue('Acme Corp');
    expect(screen.getByLabelText('Applied date')).toHaveValue('2026-07-01');

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'offer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(mocked.updateApplication).toHaveBeenCalledWith('a1', expect.objectContaining({ status: 'offer' }))
    );
    expect(await screen.findByText('Detail marker')).toBeInTheDocument();
  });
});
