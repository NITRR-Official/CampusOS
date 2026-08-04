/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthShell from '@plugins/auth/frontend/components/AuthShell';
import { ApiError } from '@plugins/auth/frontend/api';
import { useLogin } from '@plugins/auth/frontend/hooks';
import { storeAuthSession } from '@campus-os/shared/auth-session';
import { Input } from '@campusos/design-system';
import { Button } from '@campusos/design-system';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@campusos/design-system';
import {
  loginSchema,
  type LoginFormData
} from '@plugins/auth/frontend/lib/validations';

function getRedirectPath(value: string | null) {
  if (!value) {
    return '/dashboard';
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard';
  }

  return value;
}

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const nextParam = searchParams?.get('next') || null;
  const redirectTo = useMemo(() => getRedirectPath(nextParam), [nextParam]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const loginMutation = useLogin();

  function onSubmit(data: LoginFormData) {
    setError('');

    loginMutation.mutate(data, {
      onSuccess: (authData) => {
        storeAuthSession(authData);
        router.replace(redirectTo);
      },
      onError: (err: any) => {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Unable to login right now. Please try again.');
        }
      }
    });
  }

  const isLoading = loginMutation.isPending;

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
            render={({ field }: { field: any }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@campus.edu" {...field} />
                </FormControl>
                <FormMessage className="text-rose-400 text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }: { field: any }) => (
              <FormItem className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
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

          <Button type="submit" disabled={isLoading} className="w-full mt-4">
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
