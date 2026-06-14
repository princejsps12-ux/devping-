'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';
import { useAuthStore, User } from '@/store/auth';

interface AuthResponse {
  user: User;
  token: string;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export function useSignup() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (payload: SignupPayload) => {
      const { data } = await api.post<AuthResponse>('/auth/signup', payload);
      return data;
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success('Account created');
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not sign up'));
    },
  });
}

export function useLogin() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<AuthResponse>('/auth/login', payload);
      return data;
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success('Welcome back');
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Invalid credentials'));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return () => {
    logout();
    router.push('/login');
  };
}
