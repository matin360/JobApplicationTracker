import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Form from '../components/ui/Form';
import Input from '../components/ui/Input';
import useAuth from '../hooks/useAuth';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences.</p>
        </div>
      </div>

      <div className="content-grid">
        <Card title="Profile">
          <Form onSubmit={(event) => event.preventDefault()}>
            <Input label="Name" defaultValue={user?.name ?? ''} placeholder="Your name" disabled />
            <Input label="Email" type="email" defaultValue={user?.email ?? ''} disabled />
            <div>
              <Button disabled title="Coming soon">
                Save changes
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default SettingsPage;
