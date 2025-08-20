import React from "react";
import { Clock, Database, TrendingUp, Calendar } from "lucide-react";

const StatsCard = ({ title, value, icon: Icon, trend, className = "" }) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 
        dark:border-gray-700 p-3 sm:p-4 lg:p-6
        hover:shadow-md dark:hover:shadow-lg 
        hover:border-gray-300 dark:hover:border-gray-600
        transition-all duration-300 transform hover:scale-105
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1 truncate">
            {value}
          </p>
          {trend && (
            <p
              className={`
                text-xs sm:text-sm mt-1 font-medium
                ${
                  trend > 0
                    ? "text-green-600 dark:text-green-400"
                    : trend < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-400"
                }
              `}
            >
              <span className="inline-flex items-center">
                {trend > 0 && (
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {trend < 0 && (
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {trend > 0 ? "+" : ""}
                {trend}% dari sebelumnya
              </span>
            </p>
          )}
        </div>
        {Icon && (
          <div className="ml-3 flex-shrink-0">
            <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
