import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, signup } from './api';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // You could update some auth context state here or set query data
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}
