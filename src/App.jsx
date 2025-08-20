// src/App.jsx
import "./index.css";
import MainTemplates from "./components/templates/MainTemplates";
import NotFound from "./components/pages/404NotFound";
import Data from "./components/templates/Data";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
          <Routes>
            {/* Protected Routes - memerlukan authentication */}
            <Route
              path="/"
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
                  <Data />
                </ProtectedRoute>
              }
            />

            {/* 404 Page - tidak memerlukan authentication */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
