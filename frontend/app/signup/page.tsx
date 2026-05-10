'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthShell from '@/app/components/auth/AuthShell';
import { ApiError, signup } from '@/lib/auth-api';
import { storeAuthSession } from '@/lib/auth-session';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: SignupFormData) {
    setError('');
    setIsLoading(true);

    try {
      const authData = await signup({
        name: data.name,
        email: data.email,
        password: data.password,
      });
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
      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Full Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your full name"
                    className="border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-rose-400 text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@campus.edu"
                    className="border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-rose-400 text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    className="border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-rose-400 text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Re-enter password"
                    className="border-slate-600 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40 focus-visible:border-cyan-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-rose-400 text-xs" />
              </FormItem>
            )}
          />

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
      </Form>
    </AuthShell>
  );
}
