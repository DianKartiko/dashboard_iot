const TableHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-shrink-0">
            {Array.isArray(actions) ? actions : [actions]}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableHeader;
