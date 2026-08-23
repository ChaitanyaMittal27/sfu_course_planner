export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="relative w-16 h-16" aria-hidden="true">
        <div className="absolute inset-0 border-4 border-border rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  );
}
