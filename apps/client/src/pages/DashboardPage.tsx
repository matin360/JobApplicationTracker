import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateReminder } from '../api/children';
import { getDashboardSummary } from '../dashboard';
import type { DashboardSummary } from '../dashboard';
import { APPLICATION_STATUSES } from '../api/applications';
import StatusBadge from '../components/applications/StatusBadge';
import { formatDate } from '../components/applications/format';
import StatusChart from '../components/dashboard/StatusChart';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import type { TableColumn } from '../components/ui/Table';
import type { RecentApplication, UpcomingReminder } from '../dashboard';
import { useAsync } from '../hooks/useAsync';

const recentColumns: TableColumn<RecentApplication>[] = [
  {
    key: 'company',
    header: 'Company',
    render: (row) => <Link to={`/applications/${row.id}`}>{row.companyName ?? '—'}</Link>
  },
  {
    key: 'roleTitle',
    header: 'Role',
    render: (row) => <Link to={`/applications/${row.id}`}>{row.roleTitle}</Link>
  },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'appliedAt', header: 'Applied on', render: (row) => formatDate(row.appliedAt) },
  { key: 'nextFollowUpAt', header: 'Next follow-up', render: (row) => formatDate(row.nextFollowUpAt) }
];

const DashboardPage = () => {
  const { data: summary, loading, error: loadError, reload } = useAsync<DashboardSummary>(getDashboardSummary);
  const [actionError, setActionError] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);

  const error = loadError || actionError;

  const handleCompleteReminder = async (reminder: UpcomingReminder) => {
    setCompletingId(reminder.id);
    setActionError('');
    try {
      await updateReminder(reminder.id, { completed: true });
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to complete the reminder.');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return <p>Loading…</p>;
  }

  if (error || !summary) {
    return (
      <>
        <p className="form-error">{error || 'Failed to load the dashboard.'}</p>
        <Button variant="secondary" onClick={() => { setActionError(''); void reload(); }}>
          Retry
        </Button>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your job search at a glance.</p>
        </div>
      </div>

      <div className="stat-grid">
        {APPLICATION_STATUSES.map((status) => (
          <Card key={status} className="stat-card">
            <p className="stat-card__value">{summary.statusCounts[status] ?? 0}</p>
            <p className="stat-card__label">{status}</p>
          </Card>
        ))}
      </div>

      <div className="content-grid">
        <Card title="Upcoming reminders">
          {summary.reminders.upcomingList.length === 0 ? (
            <p className="page-subtitle">Nothing due in the next 7 days.</p>
          ) : (
            <ul className="child-list">
              {summary.reminders.upcomingList.map((reminder) => (
                <li key={reminder.id} className="child-item">
                  <p className="child-item__content">{reminder.title}</p>
                  <p className="child-item__meta">
                    Due {formatDate(reminder.dueAt)} ·{' '}
                    <Link to={`/applications/${reminder.application.id}`}>
                      {reminder.application.companyName
                        ? `${reminder.application.roleTitle} at ${reminder.application.companyName}`
                        : reminder.application.roleTitle}
                    </Link>
                  </p>
                  <div className="child-item__actions">
                    <Button
                      variant="secondary"
                      disabled={completingId === reminder.id}
                      onClick={() => { void handleCompleteReminder(reminder); }}
                    >
                      {completingId === reminder.id ? 'Completing…' : 'Complete'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="page-subtitle" style={{ marginTop: '0.75rem' }}>
            {summary.reminders.active} active reminder{summary.reminders.active === 1 ? '' : 's'} in total.
          </p>
        </Card>

        <Card title="Applications by status">
          <StatusChart statusCounts={summary.statusCounts} />
        </Card>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Card title="Recent applications">
          {summary.recentApplications.length === 0 ? (
            <p className="page-subtitle">
              No applications yet. <Link to="/applications/new">Create your first one</Link>.
            </p>
          ) : (
            <Table columns={recentColumns} rows={summary.recentApplications} rowKey={(row) => row.id} />
          )}
        </Card>
      </div>
    </>
  );
};

export default DashboardPage;
