import { useState } from 'react';
import AuthForm from './AuthForm';
import Button from './ui/Button';

// The public /login page: a card with a login/signup mode toggle.
const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <p className="page-subtitle">
          {mode === 'login'
            ? 'Access your tracker with your email and password.'
            : 'Create a new account to start organizing your applications.'}
        </p>

        <div className="auth-toggle">
          <Button
            variant={mode === 'login' ? 'primary' : 'secondary'}
            onClick={() => setMode('login')}
          >
            Login
          </Button>
          <Button
            variant={mode === 'signup' ? 'primary' : 'secondary'}
            onClick={() => setMode('signup')}
          >
            Sign up
          </Button>
        </div>

        <AuthForm mode={mode} />
      </div>
    </main>
  );
};

export default AuthPage;
