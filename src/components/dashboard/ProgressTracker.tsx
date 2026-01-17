interface Step {
  number: number;
  label: string;
  status: 'complete' | 'in_progress' | 'not_started';
  icon: React.ReactNode;
}

interface ProgressTrackerProps {
  steps: Step[];
}

export const ProgressTracker = ({ steps }: ProgressTrackerProps) => {
  return (
    <div className="bg-white rounded-lg shadow-card p-12">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">Your Journey</h2>
      <div className="flex items-center justify-center max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  step.status === 'complete'
                    ? 'bg-primary-600 text-white'
                    : step.status === 'in_progress'
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step.icon}
              </div>
              <p className="mt-4 text-sm font-medium text-gray-700">{step.label}</p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-32 mx-8 transition-all ${
                  step.status === 'complete' ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};