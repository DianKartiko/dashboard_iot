import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";

// PERBAIKAN: Lazy load components untuk better performance
const LoginPage = React.lazy(() => import("./components/pages/LoginPage"));
const NotFoundPage = React.lazy(() => import("./components/pages/404NotFound"));
const MainTemplates = React.lazy(() =>
  import("./components/templates/MainTemplates")
);
const DataTemplate = React.lazy(() => import("./components/templates/Data"));
const TemperatureAggregateDashboardTemplateNew = React.lazy(() =>
  import("./components/templates/TemperatureAggregateDashboardTemplate")
);

// PERBAIKAN: Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// PERBAIKAN: Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Oops! Something went wrong
      </h1>
      <p className="text-gray-600 mb-6">
        We're sorry, but something unexpected happened. Please try refreshing
        the page.
      </p>
      <div className="space-x-4">
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
      {process.env.NODE_ENV === "development" && error && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Show error details (development only)
          </summary>
          <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-auto border">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <AuthProvider>
        <div className="App bg-gray-50 dark:bg-gray-950">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainTemplates />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/data"
                element={
                  <ProtectedRoute>
                    <DataTemplate />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/temperature-dashboard"
                element={
                  <ProtectedRoute>
                    <TemperatureAggregateDashboardTemplateNew />
                  </ProtectedRoute>
                }
              />

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
