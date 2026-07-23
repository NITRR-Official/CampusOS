/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthShell from '@plugins/auth/frontend/components/AuthShell';
import { ApiError } from '@plugins/auth/frontend/api';
import { useSignup } from '@plugins/auth/frontend/hooks';
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
  signupSchema,
  type SignupFormData
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

export function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const nextParam = searchParams?.get('next') || null;
  const redirectTo = useMemo(() => getRedirectPath(nextParam), [nextParam]);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const signupMutation = useSignup();

  function onSubmit(data: SignupFormData) {
    setError('');

    signupMutation.mutate(
      {
        name: data.name,
        email: data.email,
        password: data.password
      },
      {
        onSuccess: (authData) => {
          storeAuthSession(authData);
          router.replace(redirectTo);
        },
        onError: (err: any) => {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('Unable to create account right now. Please try again.');
          }
        }
      }
    );
  }

  const isLoading = signupMutation.isPending;

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
            render={({ field }: { field: any }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormMessage className="text-rose-400 text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: any }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@campus.edu" {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
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
            render={({ field }: { field: any }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Re-enter password"
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
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
