'use client';

import AuthForm, { AuthFormValues } from '@/components/AuthForm';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
  const { mutate, isPending } = useLogin();

  function handleSubmit(values: AuthFormValues) {
    mutate({ email: values.email, password: values.password });
  }

  return <AuthForm mode="login" isLoading={isPending} onSubmit={handleSubmit} />;
}
