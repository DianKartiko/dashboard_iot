import React, { createContext, useContext, useReducer, useEffect } from "react";
import apiClient from "../../utils/apiClient";

// Auth Context
const AuthContext = createContext();

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case "LOGIN_FAILURE":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };

    case "LOGOUT":
      return {
        ...initialState,
        loading: false,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      // Update apiClient token
      apiClient.updateToken();

      // Verify token with backend
      const response = await apiClient.getCurrentUser();

      if (response.success && response.data?.user) {
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user: response.data.user,
            token: token,
          },
        });
      } else {
        // Invalid token
        localStorage.removeItem("authToken");
        dispatch({ type: "LOGIN_FAILURE", payload: "Invalid session" });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("authToken");
      dispatch({
        type: "LOGIN_FAILURE",
        payload: error.message || "Authentication check failed",
      });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const response = await apiClient.login(
        credentials.username,
        credentials.password
      );

      if (response.success && response.data?.token) {
        const { token, user } = response.data;

        // Store token dengan key yang benar
        localStorage.setItem("authToken", token);

        // Update apiClient token
        apiClient.updateToken();

        // Update state
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });

        return { success: true, user };
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || "Login failed";
      dispatch({ type: "LOGIN_FAILURE", payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Use apiClient logout method yang sudah handle semua
      await apiClient.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear state
      dispatch({ type: "LOGOUT" });
    }
  };

  const register = async (username, email, password) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const response = await apiClient.register(username, email, password);

      if (response.success) {
        dispatch({ type: "SET_LOADING", payload: false });
        return { success: true, message: response.message };
      } else {
        throw new Error(response.error || "Registration failed");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || "Registration failed";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const updateUser = (userData) => {
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  // Helper functions for role checking
  const isAdmin = () => {
    return state.user?.role === "admin" || state.user?.isDefaultAdmin === true;
  };

  const hasRole = (requiredRole) => {
    return state.user?.role === requiredRole;
  };

  const value = {
    // State
    ...state,

    // Actions
    login,
    logout,
    register,
    clearError,
    updateUser,
    checkAuthStatus,

    // Helpers
    isAdmin,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;
