export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-orange-200 dark:border-slate-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
