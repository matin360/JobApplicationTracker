import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APPLICATION_STATUSES, listApplications } from '../applications';
import type { ApplicationRecord } from '../applications';
import StatusBadge from '../components/applications/StatusBadge';
import { formatDate } from '../components/applications/format';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import type { TableColumn, TableSort } from '../components/ui/Table';

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
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState<TableSort | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    listApplications()
      .then((records) => {
        if (isMounted) {
          setApplications(records);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load applications.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    let rows = applications.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) {
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
  }, [applications, search, statusFilter, sort]);

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
        <Button onClick={() => { void navigate('/applications/new'); }}>New application</Button>
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
