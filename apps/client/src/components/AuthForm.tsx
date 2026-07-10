import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AuthResponse } from '../auth';
import { signIn, signUp } from '../auth';
import Button from './ui/Button';
import Form from './ui/Form';
import Input from './ui/Input';

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
      // Full page load on purpose: it re-runs AuthProvider so every consumer
      // picks up the fresh session. Don't "fix" this to navigate().
      window.location.assign('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
  const isValidPassword = password.length >= 8;
  const canSubmit = !loading && isValidEmail && isValidPassword;

  return (
    <Form onSubmit={(event) => { void handleSubmit(event); }}>
      {mode === 'signup' && (
        <Input
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Jane Doe"
        />
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        required
        hint={!email || isValidEmail ? undefined : 'Please enter a valid email address.'}
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="At least 8 characters"
        required
        hint={!password || isValidPassword ? undefined : 'Password must be at least 8 characters.'}
      />

      {error ? <p className="form-error">{error}</p> : null}

      <Button type="submit" disabled={!canSubmit}>
        {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>
    </Form>
  );
};

export default AuthForm;
