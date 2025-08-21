import { useState, useCallback } from "react";

export const useErrorBoundary = () => {
  const [error, setError] = useState(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error, errorInfo = {}) => {
    console.error("🚨 Error captured:", error);
    setError({ error, errorInfo, timestamp: new Date().toISOString() });
  }, []);

  return {
    error,
    resetError,
    captureError,
    hasError: !!error,
  };
};
