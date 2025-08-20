// src/components/auth/ProtectedRoute.jsx
import { useAuth } from "../contexts/AuthContext";
import LoginPage from "../pages/LoginPage";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Tampilkan loading spinner saat mengecek autentikasi
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Jika belum authenticated, tampilkan halaman login
  if (!isAuthenticated()) {
    return <LoginPage />;
  }

  // Jika sudah authenticated, tampilkan children (dashboard)
  return children;
};

export default ProtectedRoute;
