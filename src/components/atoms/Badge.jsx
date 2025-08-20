const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    success:
      "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200",
    danger: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
  };

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
        sm:px-2.5 sm:py-0.5 sm:text-xs
        md:px-3 md:py-1 md:text-sm
        transition-colors duration-200
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
