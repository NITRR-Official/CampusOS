'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthShell from '@/app/components/auth/AuthShell';
import { ApiError, login } from '@/lib/auth-api';
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
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormData) {
    setError('');
    setIsLoading(true);

    try {
      const authData = await login(data);
      storeAuthSession(authData);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to login right now. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Login to CampusOS and continue managing your campus ecosystem."
      alternateHref="/signup"
      alternateActionLabel="Need an account?"
      alternateActionText="Sign up"
    >
      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
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
                <div className="flex items-center justify-between">
                  <FormLabel className="block text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Password
                  </FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
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
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
