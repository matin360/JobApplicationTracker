import { useState } from 'react';
import AuthForm from './AuthForm';

const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <main style={{ fontFamily: 'Inter, sans-serif', padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ border: '1px solid #dde3ee', borderRadius: '16px', padding: '1.5rem', background: '#fff' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <p style={{ color: '#5d6470', marginBottom: '1rem' }}>
          {mode === 'login'
            ? 'Access your tracker with your email and password.'
            : 'Create a new account to start organizing your applications.'}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{ ...toggleStyle, ...(mode === 'login' ? activeToggleStyle : {}) }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{ ...toggleStyle, ...(mode === 'signup' ? activeToggleStyle : {}) }}
          >
            Sign up
          </button>
        </div>

        <AuthForm mode={mode} />
      </div>
    </main>
  );
};

const toggleStyle: React.CSSProperties = {
  border: '1px solid #ccd4e0',
  borderRadius: '999px',
  padding: '0.45rem 0.8rem',
  background: '#fff',
  color: '#172033'
};

const activeToggleStyle: React.CSSProperties = {
  background: '#172033',
  color: '#fff',
  borderColor: '#172033'
};

export default AuthPage;
