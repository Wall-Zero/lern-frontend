import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/endpoints/dashboard';
import { StatusCard } from '../../components/dashboard/StatusCard';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { ProgressTracker } from '../../components/dashboard/ProgressTracker';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import {
  DatabaseIcon,
  ChartIcon,
  CpuIcon,
  TargetIcon,
  FolderIcon,
  BeakerIcon,
  SparklesIcon,
  ClipboardCheckIcon,
} from '../../components/common/Icons';
import type { DashboardStats } from '../../api/endpoints/dashboard';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData] = await Promise.all([dashboardApi.getStats()]);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasDatasets = (stats?.total_datasets ?? 0) > 0;
  const hasAnalysis = (stats?.active_analysis ?? 0) > 0;
  const hasModels = (stats?.trained_models ?? 0) > 0;

  const progressSteps = [
    {
      number: 1,
      label: 'Upload Data',
      status: hasDatasets ? 'complete' : 'not_started',
      icon: <DatabaseIcon className="w-8 h-8" />,
    },
    {
      number: 2,
      label: 'Train Model',
      status: hasAnalysis ? 'complete' : 'not_started',
      icon: <ChartIcon className="w-8 h-8" />,
    },
    {
      number: 3,
      label: 'Get Predictions',
      status: hasModels ? 'complete' : 'not_started',
      icon: <TargetIcon className="w-8 h-8" />,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to LERN Platform</h1>
        <p className="text-lg text-gray-600 mt-3">
          {!hasDatasets
            ? "Let's start building your first ML model, step by step"
            : 'Continue your machine learning journey'}
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard
          title="Data Status"
          description={hasDatasets ? 'Datasets ready for training' : 'No datasets uploaded yet'}
          status={hasDatasets ? 'ready' : 'waiting'}
          icon={<DatabaseIcon className="w-6 h-6 text-primary-600" />}
        />
        <StatusCard
          title="Analysis Status"
          description={hasAnalysis ? 'Models in progress' : 'No analysis started'}
          status={hasAnalysis ? 'pending' : 'waiting'}
          icon={<ChartIcon className="w-6 h-6 text-primary-600" />}
        />
        <StatusCard
          title="Model Readiness"
          description={hasModels ? 'Trained models available' : 'No trained models yet'}
          status={hasModels ? 'ready' : 'waiting'}
          icon={<CpuIcon className="w-6 h-6 text-primary-600" />}
        />
      </div>

      {/* Stats Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Datasets"
            value={stats?.total_datasets ?? 0}
            icon={<FolderIcon />}
            color="purple"
          />
          <StatsCard
            title="Active Analysis"
            value={stats?.active_analysis ?? 0}
            icon={<BeakerIcon />}
            color="blue"
          />
          <StatsCard
            title="Trained Models"
            value={stats?.trained_models ?? 0}
            icon={<SparklesIcon />}
            color="green"
          />
          <StatsCard
            title="Predictions Made"
            value={stats?.total_predictions ?? 0}
            icon={<ClipboardCheckIcon />}
            color="orange"
          />
        </div>
      </div>

      {/* Progress Tracker */}
      <ProgressTracker steps={progressSteps as any} />

      {/* CTA Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => navigate('/datasets')}
          variant="primary"
          className="px-8 py-4 text-lg"
        >
          {hasDatasets ? 'View My Datasets' : 'Upload Your Dataset'} →
        </Button>
      </div>
    </div>
  );
};