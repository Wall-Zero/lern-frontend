import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { DatasetsList } from '../pages/datasets/DatasetsList';
import { DatasetDetail } from '../pages/datasets/DatasetDetail';
import { DatasetInsights } from '../pages/datasets/DatasetInsights';
import { AnalysisList } from '../pages/analysis/AnalysisList';
import { AnalysisDetail } from '../pages/analysis/AnalysisDetail';
import { PrivateRoute } from './PrivateRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { Predictions } from '../pages/predictions/Predictions';
import { Marketplace } from '../pages/marketplace/Marketplace';
import { PollingProvider } from '../context/PollingContext';
import Landing from '../pages/landing/Landing';
import { Workspace } from '../pages/workspace/Workspace';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
    <PollingProvider>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/datasets"
          element={
            <PrivateRoute>
              <AppLayout>
                <DatasetsList />
              </AppLayout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/datasets/:id"
          element={
            <PrivateRoute>
              <AppLayout>
                <DatasetDetail />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/datasets/:id/insights"
          element={
            <PrivateRoute>
              <AppLayout>
                <DatasetInsights />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/analysis"
          element={
            <PrivateRoute>
              <AppLayout>
                <AnalysisList />
              </AppLayout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/analysis/:id"
          element={
            <PrivateRoute>
              <AppLayout>
                <AnalysisDetail />
              </AppLayout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/predictions"
          element={
            <PrivateRoute>
              <AppLayout>
                <Predictions />
              </AppLayout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/workspace"
          element={
            <PrivateRoute>
              <AppLayout hideSidebar>
                <Workspace />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/marketplace"
          element={
            <PrivateRoute>
              <AppLayout>
                <Marketplace />
              </AppLayout>
            </PrivateRoute>
          }
        />
        
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PollingProvider>
    </BrowserRouter>
  );
};