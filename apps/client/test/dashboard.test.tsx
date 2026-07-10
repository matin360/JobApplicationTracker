import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../src/pages/DashboardPage';
import * as dashboard from '../src/dashboard';
import * as children from '../src/api/children';
import type { DashboardSummary } from '../src/dashboard';

vi.mock('../src/dashboard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/dashboard')>()),
  getDashboardSummary: vi.fn()
}));

vi.mock('../src/api/children', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/api/children')>()),
  updateReminder: vi.fn()
}));

const getSummaryMock = dashboard.getDashboardSummary as unknown as ReturnType<typeof vi.fn>;
const updateReminderMock = children.updateReminder as unknown as ReturnType<typeof vi.fn>;

function makeSummary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    statusCounts: { saved: 1, applied: 4, interviewing: 2, offer: 1, rejected: 3, withdrawn: 0 },
    reminders: {
      active: 3,
      upcoming: 1,
      upcomingList: [
        {
          id: 'rem-1',
          title: 'Send thank-you email',
          dueAt: '2026-07-12T00:00:00.000Z',
          application: { id: 'app-1', roleTitle: 'Frontend Engineer', companyName: 'Acme' }
        }
      ]
    },
    recentApplications: [
      {
        id: 'app-1',
        companyName: 'Acme',
        roleTitle: 'Frontend Engineer',
        status: 'applied',
        appliedAt: '2026-07-01T00:00:00.000Z',
        nextFollowUpAt: null
      }
    ],
    ...overrides
  };
}

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders status cards, chart, reminders, and recent applications', async () => {
    getSummaryMock.mockResolvedValue(makeSummary());

    const { container } = renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();

    // Status cards show the counts.
    const statCards = Array.from(container.querySelectorAll('.stat-card'));
    const findCard = (label: string) => statCards.find((card) => card.textContent?.includes(label));
    expect(findCard('applied')).toHaveTextContent('4');
    expect(findCard('rejected')).toHaveTextContent('3');

    // Chart is present with an accessible name.
    expect(screen.getByRole('img', { name: 'Applications by status' })).toBeInTheDocument();

    // Upcoming reminder with link to its application.
    expect(screen.getByText('Send thank-you email')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Frontend Engineer at Acme' })).toHaveAttribute(
      'href',
      '/applications/app-1'
    );

    // Recent applications table links to detail.
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/applications/app-1');
  });

  it('completes a reminder and refetches the summary', async () => {
    getSummaryMock
      .mockResolvedValueOnce(makeSummary())
      .mockResolvedValueOnce(
        makeSummary({ reminders: { active: 2, upcoming: 0, upcomingList: [] } })
      );
    updateReminderMock.mockResolvedValue({});

    renderDashboard();
    await screen.findByText('Send thank-you email');

    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));

    await waitFor(() => expect(updateReminderMock).toHaveBeenCalledWith('rem-1', { completed: true }));
    expect(await screen.findByText('Nothing due in the next 7 days.')).toBeInTheDocument();
    expect(getSummaryMock).toHaveBeenCalledTimes(2);
  });

  it('shows an error state with a retry button', async () => {
    getSummaryMock.mockRejectedValueOnce(new Error('Server down')).mockResolvedValueOnce(makeSummary());

    renderDashboard();

    expect(await screen.findByText('Server down')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('shows empty states when there is no data', async () => {
    getSummaryMock.mockResolvedValue(
      makeSummary({
        statusCounts: { saved: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0, withdrawn: 0 },
        reminders: { active: 0, upcoming: 0, upcomingList: [] },
        recentApplications: []
      })
    );

    renderDashboard();

    expect(await screen.findByText('Nothing due in the next 7 days.')).toBeInTheDocument();
    expect(screen.getByText(/No applications yet\. /)).toBeInTheDocument();
    expect(screen.getByText('No applications yet — the chart will fill in as you add them.')).toBeInTheDocument();
  });
});
