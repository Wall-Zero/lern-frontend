import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { DatasetsList } from '../pages/datasets/DatasetsList';
import { DatasetDetail } from '../pages/datasets/DatasetDetail';
import { AnalysisList } from '../pages/analysis/AnalysisList';
import { AnalysisDetail } from '../pages/analysis/AnalysisDetail';
import { PrivateRoute } from './PrivateRoute';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/datasets"
          element={
            <PrivateRoute>
              <DatasetsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/datasets/:id"
          element={
            <PrivateRoute>
              <DatasetDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <PrivateRoute>
              <AnalysisList />
            </PrivateRoute>
          }
        />
        <Route
          path="/analysis/:id"
          element={
            <PrivateRoute>
              <AnalysisDetail />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/datasets" />} />
      </Routes>
    </BrowserRouter>
  );
};