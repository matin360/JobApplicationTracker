import Badge from '../components/ui/Badge';
import type { BadgeTone } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import type { TableColumn } from '../components/ui/Table';

interface MockApplication {
  id: string;
  company: string;
  role: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  appliedOn: string;
}

// Static placeholder rows; swapped for API data when the applications endpoints land.
const mockApplications: MockApplication[] = [
  { id: '1', company: 'Acme Corp', role: 'Frontend Engineer', status: 'Applied', appliedOn: '2026-06-28' },
  { id: '2', company: 'Globex', role: 'Full-stack Developer', status: 'Interview', appliedOn: '2026-06-21' },
  { id: '3', company: 'Initech', role: 'React Developer', status: 'Offer', appliedOn: '2026-06-10' },
  { id: '4', company: 'Umbrella', role: 'Software Engineer', status: 'Rejected', appliedOn: '2026-06-02' }
];

const statusTone: Record<MockApplication['status'], BadgeTone> = {
  Applied: 'info',
  Interview: 'warning',
  Offer: 'success',
  Rejected: 'danger'
};

const columns: TableColumn<MockApplication>[] = [
  { key: 'company', header: 'Company', render: (row) => row.company },
  { key: 'role', header: 'Role', render: (row) => row.role },
  { key: 'status', header: 'Status', render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
  { key: 'appliedOn', header: 'Applied on', render: (row) => row.appliedOn }
];

const ApplicationsPage = () => (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">Applications</h1>
        <p className="page-subtitle">Track every application in one place.</p>
      </div>
      <Button disabled title="Coming soon">
        New application
      </Button>
    </div>

    <Table columns={columns} rows={mockApplications} rowKey={(row) => row.id} emptyMessage="No applications yet." />
  </>
);

export default ApplicationsPage;
