import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};
