// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/login";
import RegisterPage from "../pages/register";
import DashboardPage from "../pages/dashboard";
import { useAuth } from "../auth/auth.context";

export default function AppRouter() {
  const { isAuth } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route 
            path="/" 
            element={isAuth ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />

        <Route
          path="/login"
          element={isAuth ? <Navigate to="/dashboard" /> : <LoginPage />}
        />

        <Route
          path="/register"
          element={isAuth ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />

        <Route
          path="/dashboard"
          element={isAuth ? <DashboardPage /> : <Navigate to="/login" />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}