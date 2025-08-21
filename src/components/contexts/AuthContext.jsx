import React, { createContext, useContext, useState, useEffect } from "react";

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
  const [error, setError] = useState(null);

  // PERBAIKAN: Base API URL
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // PERBAIKAN: Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("authUser");

        if (storedToken && storedUser) {
          setToken(storedToken);

          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            // PERBAIKAN: Verify token masih valid
            await verifyToken(storedToken);
          } catch (parseError) {
            console.warn("Invalid stored user data, clearing auth");
            await logout();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // PERBAIKAN: Verify token validity
  const verifyToken = async (tokenToVerify = token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${tokenToVerify}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Token verification failed");
      }

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        return true;
      } else {
        throw new Error("Invalid token response");
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      await logout();
      return false;
    }
  };

  // PERBAIKAN: Login with hybrid auth support
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.success) {
        const { token: newToken, user: newUser } = data.data;

        // Store auth data
        localStorage.setItem("authToken", newToken);
        localStorage.setItem("authUser", JSON.stringify(newUser));

        setToken(newToken);
        setUser(newUser);

        // PERBAIKAN: Log successful login dengan info default admin
        console.log("Login successful:", {
          username: newUser.username,
          role: newUser.role,
          isDefaultAdmin: newUser.isDefaultAdmin,
        });

        return {
          success: true,
          user: newUser,
          isDefaultAdmin: newUser.isDefaultAdmin,
        };
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // PERBAIKAN: Register function
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      if (data.success) {
        console.log("Registration successful:", data.data.user);
        return {
          success: true,
          user: data.data.user,
          message:
            "Registration successful. Please login with your credentials.",
        };
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // PERBAIKAN: Logout function
  const logout = async () => {
    try {
      // PERBAIKAN: Call logout endpoint if token exists
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        } catch (logoutError) {
          console.warn("Logout endpoint call failed:", logoutError);
          // Continue with local logout anyway
        }
      }

      // Clear local state
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      setToken(null);
      setUser(null);
      setError(null);

      console.log("Logout completed");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // PERBAIKAN: Get auth info
  const getAuthInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/info`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      }

      return null;
    } catch (error) {
      console.error("Failed to get auth info:", error);
      return null;
    }
  };

  // PERBAIKAN: Check if user is admin
  const isAdmin = () => {
    return user?.role === "admin";
  };

  // PERBAIKAN: Check if user is default admin
  const isDefaultAdmin = () => {
    return user?.isDefaultAdmin === true;
  };

  // PERBAIKAN: Get users (admin only)
  const getUsers = async () => {
    try {
      if (!isAdmin()) {
        throw new Error("Admin privileges required");
      }

      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        return data.data.users;
      } else {
        throw new Error(data.message || "Failed to get users");
      }
    } catch (error) {
      console.error("Get users error:", error);
      throw error;
    }
  };

  // PERBAIKAN: Authenticated API request helper
  const authenticatedRequest = async (url, options = {}) => {
    if (!token) {
      throw new Error("No authentication token available");
    }

    const defaultHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const requestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, requestOptions);

      // PERBAIKAN: Handle token expiry
      if (response.status === 401) {
        console.warn("Token expired or invalid, logging out");
        await logout();
        throw new Error("Authentication expired. Please login again.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.message.includes("Authentication expired")) {
        throw error;
      }

      console.error("Authenticated request failed:", error);
      throw new Error(error.message || "Request failed");
    }
  };

  // PERBAIKAN: Context value
  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    verifyToken,
    getAuthInfo,
    isAdmin,
    isDefaultAdmin,
    getUsers,
    authenticatedRequest,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
