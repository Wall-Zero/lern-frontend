import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/endpoints/auth';
import type { User, AuthContextType, RegisterRequest } from '../types/auth.types';
import type { ReactNode } from 'react';
import { storage } from '../utils/storage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = storage.getAccessToken();
      
      if (token) {
        try {
          const userData = await authApi.me();
          setUser(userData);
        } catch (error) {
          storage.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    storage.setTokens(response.access, response.refresh);
    
    const userData = await authApi.me();
    setUser(userData);
  };

  const register = async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    storage.setTokens(response.tokens.access, response.tokens.refresh);
    setUser(response.user);
  };

  const logout = async () => {
    const refreshToken = storage.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        // Ignorar error si falla el logout en backend
      }
    }
    storage.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};