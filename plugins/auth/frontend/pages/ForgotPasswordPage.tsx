'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthShell from '@plugins/auth/frontend/components/AuthShell';
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
  forgotPasswordSchema,
  type ForgotPasswordFormData
} from '@plugins/auth/frontend/lib/validations';

export function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  async function onSubmit() {
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
          If an account exists for{' '}
          <span className="font-semibold">{form.getValues().email}</span>, you
          will receive reset instructions shortly.
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
      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
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

          <Button type="submit" disabled={isLoading} className="w-full mt-4">
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
