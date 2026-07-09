import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

// Static placeholder numbers; real data arrives with the applications API work.
const stats = [
  { label: 'Total applications', value: 12 },
  { label: 'Active applications', value: 7 },
  { label: 'Interviews scheduled', value: 3 },
  { label: 'Follow-ups due', value: 2 }
];

const recentActivity = [
  { id: '1', text: 'Applied to Frontend Engineer at Acme Corp', when: 'Today' },
  { id: '2', text: 'Interview scheduled with Globex', when: 'Yesterday' },
  { id: '3', text: 'Follow-up reminder for Initech', when: '2 days ago' }
];

const DashboardPage = () => (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your job search at a glance.</p>
      </div>
    </div>

    <div className="stat-grid">
      {stats.map((stat) => (
        <Card key={stat.label} className="stat-card">
          <p className="stat-card__value">{stat.value}</p>
          <p className="stat-card__label">{stat.label}</p>
        </Card>
      ))}
    </div>

    <div className="content-grid">
      <Card title="Recent activity">
        <ul>
          {recentActivity.map((item) => (
            <li key={item.id}>
              {item.text} <Badge tone="neutral">{item.when}</Badge>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Getting started">
        <p>
          This dashboard will show live pipeline data once applications tracking lands. For now it&apos;s a
          preview of the layout.
        </p>
      </Card>
    </div>
  </>
);

export default DashboardPage;
