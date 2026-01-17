import toast from 'react-hot-toast';

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#10B981',
      color: '#fff',
    },
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
  });
};

export const showAnalysisReadyToast = (
  name: string,
  onView: () => void
) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <svg
                className="h-6 w-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Analysis ready!
              </p>
              <p className="mt-1 text-sm text-gray-500">
                &quot;{name}&quot; is ready to configure.
              </p>
            </div>
          </div>
        </div>

        <div className="flex border-l border-gray-200">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onView();
            }}
            className="w-full p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
          >
            View Analysis
          </button>
        </div>
      </div>
    ),
    {
      duration: 10000,
      position: 'top-right',
    }
  );
};
