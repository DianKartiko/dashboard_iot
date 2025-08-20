import React, { useEffect, useState } from "react";
import TemperatureAggregateDashboard from "../templates/TemperatureAggregateDashboardTemplate";

const TemperatureAggregatePage = () => {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Meta viewport for mobile responsiveness */}
      <div className="w-full">
        <TemperatureAggregateDashboard />
      </div>
    </div>
  );
};

export default TemperatureAggregatePage;
