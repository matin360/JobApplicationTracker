import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteApplication, getApplication } from '../api/applications';
import type { ApplicationDetail } from '../api/applications';
import ActivityTimeline from '../components/applications/ActivityTimeline';
import InterviewsSection from '../components/applications/InterviewsSection';
import NotesSection from '../components/applications/NotesSection';
import RemindersSection from '../components/applications/RemindersSection';
import StatusBadge from '../components/applications/StatusBadge';
import { formatDate } from '../components/applications/format';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const ApplicationDetailPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!applicationId) {
      return;
    }

    let isMounted = true;

    getApplication(applicationId)
      .then((record) => {
        if (isMounted) {
          setApplication(record);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load the application.');
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
  }, [applicationId]);

  const handleDelete = async () => {
    if (!applicationId) {
      return;
    }

    setDeleting(true);
    try {
      await deleteApplication(applicationId);
      void navigate('/applications');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete the application.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  if (loading) {
    return <p>Loading…</p>;
  }

  if (error || !application) {
    return (
      <>
        <p className="form-error">{error || 'Application not found.'}</p>
        <p>
          <Link to="/applications">Back to applications</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{application.roleTitle}</h1>
          <p className="page-subtitle">
            {application.company?.name ?? 'No company'} · <StatusBadge status={application.status} />
          </p>
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => { void navigate(`/applications/${application.id}/edit`); }}>
            Edit
          </Button>
          {confirmingDelete ? (
            <>
              <Button variant="danger" disabled={deleting} onClick={() => { void handleDelete(); }}>
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </Button>
              <Button variant="secondary" disabled={deleting} onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <Card title="Details">
        <dl className="detail-list">
          <div>
            <dt>Company</dt>
            <dd>{application.company?.name ?? '—'}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{application.location ?? '—'}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{application.source ?? '—'}</dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd>{application.priority ? <Badge tone={application.priority === 'high' ? 'danger' : application.priority === 'low' ? 'neutral' : 'info'}>{application.priority}</Badge> : '—'}</dd>
          </div>
          <div>
            <dt>Applied on</dt>
            <dd>{formatDate(application.appliedAt)}</dd>
          </div>
          <div>
            <dt>Next follow-up</dt>
            <dd>{formatDate(application.nextFollowUpAt)}</dd>
          </div>
          <div>
            <dt>Job URL</dt>
            <dd>
              {application.jobUrl ? (
                <a href={application.jobUrl} target="_blank" rel="noreferrer">
                  {application.jobUrl}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="detail-grid">
        <NotesSection
          applicationId={application.id}
          notes={application.notes}
          onChange={(notes) => setApplication({ ...application, notes })}
        />
        <RemindersSection
          applicationId={application.id}
          reminders={application.reminders}
          onChange={(reminders) => setApplication({ ...application, reminders })}
        />
        <InterviewsSection
          applicationId={application.id}
          interviews={application.interviews}
          onChange={(interviews) => setApplication({ ...application, interviews })}
        />
        <ActivityTimeline application={application} />
      </div>

      <p style={{ marginTop: '1rem' }}>
        <Link to="/applications">← Back to applications</Link>
      </p>
    </>
  );
};

export default ApplicationDetailPage;
