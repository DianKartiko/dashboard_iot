import React from "react";
import { Download } from "lucide-react";

const ButtonData = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  icon: Icon,
  className = "",
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg 
    transition-all duration-200 focus:outline-none focus:ring-2 
    focus:ring-offset-2 dark:focus:ring-offset-gray-800 cursor-pointer
    disabled:transform-none disabled:hover:scale-100
  `;

  const variants = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 
      dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-blue-400
      shadow-lg hover:shadow-xl
    `,
    secondary: `
      bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500
      dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-400
      shadow-lg hover:shadow-xl
    `,
    success: `
      bg-green-600 hover:bg-green-700 text-white focus:ring-green-500
      dark:bg-green-700 dark:hover:bg-green-600 dark:focus:ring-green-400
      shadow-lg hover:shadow-xl
    `,
    danger: `
      bg-red-600 hover:bg-red-700 text-white focus:ring-red-500
      dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-red-400
      shadow-lg hover:shadow-xl
    `,
    outline: `
      border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500
      dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 
      dark:text-gray-200 dark:focus:ring-blue-400
      shadow-sm hover:shadow-md
    `,
  };

  const sizes = {
    sm: "px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm",
    md: "px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-sm md:px-5 md:py-2.5",
    lg: "px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base md:px-8 md:py-4",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${disabled ? "opacity-50 cursor-not-allowed" : ""} 
        ${className}
      `}
    >
      {Icon && (
        <Icon
          className={`
          mr-1 h-3 w-3
          sm:mr-2 sm:h-4 sm:w-4
          ${size === "lg" ? "md:h-5 md:w-5" : ""}
          ${size === "sm" ? "sm:h-3 sm:w-3" : ""}
        `}
        />
      )}
      <span className="truncate">{children}</span>
    </button>
  );
};

export default ButtonData;
