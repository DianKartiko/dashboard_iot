// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = localStorage.getItem("token");
        if (savedToken) {
          // Validate token dengan backend
          const response = await fetch(
            "http://localhost:5000/api/auth/verify",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${savedToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setToken(savedToken);
            setUser(data.user);
          } else {
            // Token tidak valid, hapus dari localStorage
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Simpan token ke localStorage dan state
        localStorage.setItem("token", data.token);
        setToken(data.token);

        // Decode token untuk mendapatkan user info (simple decode, dalam production gunakan jwt-decode)
        const tokenPayload = JSON.parse(atob(data.token.split(".")[1]));
        setUser({
          userId: tokenPayload.userId,
          username: tokenPayload.username,
        });

        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Terjadi kesalahan saat terhubung ke server",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    return token !== null && user !== null;
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
