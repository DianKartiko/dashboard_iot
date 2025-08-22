import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireRole = null,
}) => {
  const { isAuthenticated, loading, user, error } = useAuth();
  const location = useLocation();

  // PERBAIKAN: Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-center">
            <p className="text-gray-600 font-medium">
              Verifying authentication...
            </p>
            <p className="text-sm text-gray-500">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  // PERBAIKAN: Show auth error if exists
  if (error && !isAuthenticated) {
    console.log("ProtectedRoute: Auth error, redirecting to login");
    return <Navigate to="/login" state={{ from: location, error }} replace />;
  }

  // PERBAIKAN: Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("ProtectedRoute: User not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // PERBAIKAN: Check admin requirement
  if (requireAdmin && user?.role !== "admin" && !user?.isDefaultAdmin) {
    console.log("ProtectedRoute: Admin access required but user is not admin");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You need administrator privileges to access this page.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PERBAIKAN: Check specific role requirement
  if (requireRole && user?.role !== requireRole) {
    console.log(
      `ProtectedRoute: Role '${requireRole}' required but user has '${user?.role}'`
    );
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-orange-500 text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Insufficient Permissions
          </h2>
          <p className="text-gray-600 mb-6">
            Your current role ({user?.role}) doesn't have permission to access
            this page. Required role: {requireRole}
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // PERBAIKAN: Log successful auth check with more details
  console.log("ProtectedRoute: User authenticated successfully", {
    username: user?.username,
    role: user?.role,
    isDefaultAdmin: user?.isDefaultAdmin,
    requireAdmin,
    requireRole,
    path: location.pathname,
  });

  // PERBAIKAN: Add user context to children
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { currentUser: user });
    }
    return child;
  });

  return childrenWithProps;
};

// PERBAIKAN: Export variants for common use cases
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requireAdmin={true}>{children}</ProtectedRoute>
);

export const UserRoute = ({ children }) => (
  <ProtectedRoute requireRole="user">{children}</ProtectedRoute>
);

export default ProtectedRoute;
