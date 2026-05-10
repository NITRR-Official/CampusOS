'use client';

import { FormEvent, useState } from 'react';
import AuthShell from '@/app/components/auth/AuthShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    // Mock API call delay
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1000);
  }

  if (isSubmitted) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We've sent a password reset link to your email address."
        alternateHref="/login"
        alternateActionLabel="Back to"
        alternateActionText="Login"
      >
        <div className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          If an account exists for <span className="font-semibold">{email}</span>, you will receive reset instructions shortly.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter your email to receive a password reset link."
      alternateHref="/login"
      alternateActionLabel="Remember your password?"
      alternateActionText="Login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
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

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold"
        >
          {isLoading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  );
}
