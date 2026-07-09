import { useNavigate } from 'react-router-dom';
import { createApplication } from '../applications';
import ApplicationForm from '../components/applications/ApplicationForm';
import Card from '../components/ui/Card';

const NewApplicationPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">New application</h1>
          <p className="page-subtitle">Add a role you&apos;re tracking.</p>
        </div>
      </div>

      <Card>
        <ApplicationForm
          submitLabel="Create"
          onSubmit={async (input) => {
            const application = await createApplication(input);
            void navigate(`/applications/${application.id}`);
          }}
          onCancel={() => { void navigate('/applications'); }}
        />
      </Card>
    </>
  );
};

export default NewApplicationPage;
