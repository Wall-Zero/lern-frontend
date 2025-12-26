import apiClient from '../client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '../../types/auth.types';

export const authApi = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post('/auth/register/', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login/', data);
    return response.data;
  },

  logout: async (refresh: string): Promise<void> => {
    await apiClient.post('/auth/logout/', { refresh });
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const response = await apiClient.post('/auth/token/refresh/', { refresh });
    return response.data;
  },
};