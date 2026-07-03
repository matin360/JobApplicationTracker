import { FormEvent, useState } from 'react';
import type { AuthResponse } from '../auth';
import { signIn, signUp } from '../auth';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSuccess?: (user: AuthResponse['user']) => void;
}

const AuthForm = ({ mode, onSuccess }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        email: email.trim(),
        password,
        ...(mode === 'signup' ? { name: name.trim() || undefined } : {})
      };

      const response = mode === 'login'
        ? await signIn(payload)
        : await signUp(payload);

      onSuccess?.(response.user);
      window.location.assign('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
  const isValidPassword = password.length >= 8;

  return (
    <form onSubmit={(event) => { void handleSubmit(event); }} style={{ display: 'grid', gap: '0.9rem' }}>
      {mode === 'signup' && (
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem' }}>
          <span>Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Doe"
            style={inputStyle}
          />
        </label>
      )}

      <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem' }}>
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
          required
        />
        {!email || isValidEmail ? null : <span style={hintStyle}>Please enter a valid email address.</span>}
      </label>

      <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem' }}>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          style={inputStyle}
          required
        />
        {!password || isValidPassword ? null : <span style={hintStyle}>Password must be at least 8 characters.</span>}
      </label>

      {error ? <p style={errorStyle}>{error}</p> : null}

      <button
        type="submit"
        disabled={loading || !isValidEmail || !isValidPassword}
        style={{
          ...buttonStyle,
          opacity: loading || !isValidEmail || !isValidPassword ? 0.7 : 1,
          cursor: loading || !isValidEmail || !isValidPassword ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  );
};

const inputStyle: React.CSSProperties = {
  border: '1px solid #ccd4e0',
  borderRadius: '10px',
  padding: '0.75rem 0.85rem',
  fontSize: '0.95rem'
};

const buttonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '10px',
  padding: '0.8rem 1rem',
  background: '#172033',
  color: '#fff',
  fontWeight: 600
};

const hintStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#6a7488'
};

const errorStyle: React.CSSProperties = {
  padding: '0.7rem 0.8rem',
  borderRadius: '10px',
  background: '#fde8e8',
  color: '#8c1d1d',
  fontSize: '0.9rem'
};

export default AuthForm;
