import { useState } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import { signOut } from './auth';

const App = () => {
  const isAuthenticatedPage = window.location.pathname !== '/login';
  const [signingOut, setSigningOut] = useState(false);

  if (!isAuthenticatedPage) {
    return <LoginPage />;
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // Even if the logout request fails, fall through to the login page;
      // the session cookie is HttpOnly so the server remains the source of truth.
    } finally {
      window.location.assign('/login');
    }
  };

  return (
    <ProtectedRoute>
      <main style={{ fontFamily: 'Inter, sans-serif', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <h1>Job Application Tracker</h1>
          <button
            type="button"
            onClick={() => { void handleSignOut(); }}
            disabled={signingOut}
            style={{
              border: '1px solid #ccd4e0',
              borderRadius: '10px',
              padding: '0.6rem 1rem',
              background: '#fff',
              color: '#172033',
              fontWeight: 600,
              cursor: signingOut ? 'not-allowed' : 'pointer',
              opacity: signingOut ? 0.7 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
        <p>
          A self-hostable workspace for tracking applications, notes, reminders, and interviews.
        </p>
        <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
          <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '1rem' }}>
            <h2>Planned MVP</h2>
            <ul>
              <li>Dashboard with pipeline summary</li>
              <li>Applications list and detail view</li>
              <li>Notes, reminders, and interviews</li>
              <li>Settings and export basics</li>
            </ul>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '1rem' }}>
            <h2>Current status</h2>
            <p>The repository is now scaffolded with a frontend and backend starter.</p>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
};

export default App;
