interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="light-card dark:dark-card border-l-4 border-red-500 p-6">
      <div className="flex items-start space-x-3">
        <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold text-red-800 dark:text-red-400 mb-1">Error Loading Data</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn-secondary text-sm">
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
