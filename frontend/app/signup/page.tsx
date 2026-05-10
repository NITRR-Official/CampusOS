'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/app/components/auth/AuthShell';
import { ApiError, signup } from '@/lib/auth-api';
import { storeAuthSession } from '@/lib/auth-session';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const authData = await signup({ name, email, password });
      storeAuthSession(authData);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to create account right now. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Join CampusOS to organize clubs, events, and operations in one place."
      alternateHref="/login"
      alternateActionLabel="Already have an account?"
      alternateActionText="Login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-300"
          >
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your full name"
            minLength={2}
            maxLength={80}
            required
            className="border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-300"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@campus.edu"
            required
            className="border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-300"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            maxLength={128}
            required
            className="border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-300"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter password"
            minLength={8}
            maxLength={128}
            required
            className="border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400"
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
