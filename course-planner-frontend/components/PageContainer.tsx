interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
}

export default function PageContainer({ children, title }: PageContainerProps) {
  return (
    <div className="min-h-screen pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
