import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getApplication, updateApplication } from '../api/applications';
import type { ApplicationRecord } from '../api/applications';
import ApplicationForm from '../components/applications/ApplicationForm';
import Card from '../components/ui/Card';

const EditApplicationPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
          <h1 className="page-title">Edit application</h1>
          <p className="page-subtitle">{application.roleTitle}</p>
        </div>
      </div>

      <Card>
        <ApplicationForm
          initial={application}
          submitLabel="Save changes"
          onSubmit={async (input) => {
            await updateApplication(application.id, input);
            void navigate(`/applications/${application.id}`);
          }}
          onCancel={() => { void navigate(`/applications/${application.id}`); }}
        />
      </Card>
    </>
  );
};

export default EditApplicationPage;
