'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthShell from '@/app/components/auth/AuthShell';
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
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
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
          If an account exists for <span className="font-semibold">{form.getValues().email}</span>, you will receive reset instructions shortly.
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold"
          >
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}

