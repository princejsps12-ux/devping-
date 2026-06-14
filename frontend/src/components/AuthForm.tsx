'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button, Card, Input } from '@/components/ui';

export interface AuthFormValues {
  name: string;
  email: string;
  password: string;
}

interface AuthFormProps {
  mode: 'login' | 'signup';
  isLoading: boolean;
  onSubmit: (values: AuthFormValues) => void;
}

export default function AuthForm({ mode, isLoading, onSubmit }: AuthFormProps) {
  const isSignup = mode === 'signup';
  const [values, setValues] = useState<AuthFormValues>({ name: '', email: '', password: '' });

  function handleChange(field: keyof AuthFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo />
          <div>
            <h1 className="text-xl font-medium tracking-tight text-primary">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-secondary">
              {isSignup
                ? 'Start monitoring your services in minutes.'
                : 'Log in to your DevPing dashboard.'}
            </p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-medium text-secondary">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ada Lovelace"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-secondary">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                mono
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-secondary">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                minLength={isSignup ? 8 : undefined}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {isSignup ? 'Create account' : 'Log in'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-secondary">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary transition-colors hover:text-accent">
                Log in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary transition-colors hover:text-accent">
                Sign up
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
