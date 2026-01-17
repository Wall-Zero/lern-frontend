import { motion } from 'framer-motion';

interface Step {
  number: number;
  label: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
}

export const WizardStepper = ({ steps, currentStep }: WizardStepperProps) => {
  return (
    <div className="flex items-center justify-center max-w-3xl mx-auto py-8">
      {steps.map((step, index) => {
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;
        
        return (
          <div key={step.number} className="flex items-center">
            {/* Step Container */}
            <div className="flex flex-col items-center">
              {/* Step Circle */}
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                  isCompleted
                    ? 'bg-primary-600 border-primary-600'
                    : isActive
                    ? 'bg-white border-primary-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span
                    className={`text-base font-semibold ${
                      isActive ? 'text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    {step.number}
                  </span>
                )}
              </motion.div>
              
              {/* Step Label */}
              <span
                className={`mt-3 text-sm font-medium text-center ${
                  isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="relative w-32 h-0.5 mx-6 bg-gray-200 -mt-8">
                <motion.div
                  initial={false}
                  animate={{
                    width: isCompleted ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-0 left-0 h-full bg-primary-600"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};