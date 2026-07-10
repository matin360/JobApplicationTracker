import { Link, useNavigate, useParams } from 'react-router-dom';
import { updateApplication } from '../api/applications';
import ApplicationForm from '../components/applications/ApplicationForm';
import Card from '../components/ui/Card';
import { useApplication } from '../hooks/useApplication';

const EditApplicationPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { data: application, loading, error } = useApplication(applicationId);
  const navigate = useNavigate();

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
