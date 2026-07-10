import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APPLICATION_STATUSES, listApplications } from '../api/applications';
import { downloadApplicationsCsv } from '../api/export';
import type { ApplicationRecord, ApplicationStatus } from '../api/applications';
import StatusBadge from '../components/applications/StatusBadge';
import { formatDate } from '../components/applications/format';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import type { TableColumn, TableSort } from '../components/ui/Table';
import { useAsync } from '../hooks/useAsync';
import { useBusyAction } from '../hooks/useBusyAction';

const columns: TableColumn<ApplicationRecord>[] = [
  {
    key: 'company',
    header: 'Company',
    sortable: true,
    render: (row) => <Link to={`/applications/${row.id}`}>{row.company?.name ?? '—'}</Link>
  },
  {
    key: 'roleTitle',
    header: 'Role',
    sortable: true,
    render: (row) => <Link to={`/applications/${row.id}`}>{row.roleTitle}</Link>
  },
  { key: 'status', header: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
  { key: 'appliedAt', header: 'Applied on', sortable: true, render: (row) => formatDate(row.appliedAt) },
  { key: 'nextFollowUpAt', header: 'Next follow-up', sortable: true, render: (row) => formatDate(row.nextFollowUpAt) }
];

function compareValues(a: ApplicationRecord, b: ApplicationRecord, key: string): number {
  const pick = (row: ApplicationRecord): string => {
    switch (key) {
      case 'company':
        return row.company?.name?.toLowerCase() ?? '';
      case 'roleTitle':
        return row.roleTitle.toLowerCase();
      case 'status':
        return row.status;
      case 'appliedAt':
        return row.appliedAt ?? '';
      case 'nextFollowUpAt':
        return row.nextFollowUpAt ?? '';
      default:
        return '';
    }
  };

  return pick(a).localeCompare(pick(b));
}

const ApplicationsPage = () => {
  const { data, loading, error: loadError } = useAsync(() => listApplications());
  const { busy: exporting, error: exportError, run: runExport } = useBusyAction();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [sort, setSort] = useState<TableSort | undefined>(undefined);
  const navigate = useNavigate();

  const applications = useMemo(() => data ?? [], [data]);
  const error = loadError || exportError;

  const handleExport = () =>
    runExport(() =>
      downloadApplicationsCsv({
        statuses: statusFilter === 'all' ? undefined : [statusFilter as ApplicationStatus],
        from: appliedFrom || undefined,
        to: appliedTo || undefined
      })
    );

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    let rows = applications.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) {
        return false;
      }
      // Date-range filter on the applied date (inclusive; unset bounds are open).
      const appliedDate = row.appliedAt ? row.appliedAt.slice(0, 10) : null;
      if ((appliedFrom || appliedTo) && !appliedDate) {
        return false;
      }
      if (appliedFrom && appliedDate && appliedDate < appliedFrom) {
        return false;
      }
      if (appliedTo && appliedDate && appliedDate > appliedTo) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        row.roleTitle.toLowerCase().includes(query) ||
        (row.company?.name.toLowerCase().includes(query) ?? false)
      );
    });

    if (sort) {
      rows = [...rows].sort((a, b) => {
        const result = compareValues(a, b, sort.key);
        return sort.direction === 'asc' ? result : -result;
      });
    }

    return rows;
  }, [applications, search, statusFilter, appliedFrom, appliedTo, sort]);

  const handleSortChange = (key: string) => {
    setSort((current) => {
      if (current?.key !== key) {
        return { key, direction: 'asc' };
      }
      return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">Track every application in one place.</p>
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => { void handleExport(); }} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button onClick={() => { void navigate('/applications/new'); }}>New application</Button>
        </div>
      </div>

      <div className="filter-bar">
        <Input
          label="Search"
          placeholder="Company or role"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Input label="Applied from" type="date" value={appliedFrom} onChange={(event) => setAppliedFrom(event.target.value)} />
        <Input label="Applied to" type="date" value={appliedTo} onChange={(event) => setAppliedTo(event.target.value)} />
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <Table
          columns={columns}
          rows={visibleApplications}
          rowKey={(row) => row.id}
          emptyMessage={applications.length === 0 ? 'No applications yet. Create your first one!' : 'No applications match your filters.'}
          sort={sort}
          onSortChange={handleSortChange}
        />
      )}
    </>
  );
};

export default ApplicationsPage;
