'use client';

import AuthForm, { AuthFormValues } from '@/components/AuthForm';
import { useSignup } from '@/hooks/useAuth';

export default function SignupPage() {
  const { mutate, isPending } = useSignup();

  function handleSubmit(values: AuthFormValues) {
    mutate(values);
  }

  return <AuthForm mode="signup" isLoading={isPending} onSubmit={handleSubmit} />;
}
