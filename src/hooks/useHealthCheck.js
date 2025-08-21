import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../utils/apiClient";

// PERBAIKAN: Comprehensive health check hook
const useHealthCheck = (options = {}) => {
  const {
    interval = 30000, // 30 seconds
    enableAutoCheck = true,
    onStatusChange = null,
    retryAttempts = 3,
    retryDelay = 5000,
  } = options;

  const [healthStatus, setHealthStatus] = useState({
    overall: "unknown",
    database: { connected: false, status: "unknown" },
    mqtt: { connected: false, status: "unknown" },
    api: { connected: false, status: "unknown" },
    lastCheck: null,
    loading: false,
    error: null,
  });

  const [systemStats, setSystemStats] = useState({
    uptime: 0,
    totalReadings: 0,
    averageTemp: 0,
    lastTemperature: null,
    bufferSize: 0,
  });

  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // PERBAIKAN: Check API connectivity
  const checkApiHealth = useCallback(async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/health/live`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        }
      );

      if (response.ok) {
        return { connected: true, status: "healthy", responseTime: Date.now() };
      } else {
        return {
          connected: false,
          status: "unhealthy",
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return { connected: false, status: "error", error: error.message };
    }
  }, []);

  // PERBAIKAN: Get comprehensive health status
  const checkFullHealth = useCallback(async () => {
    try {
      const [healthResponse, readinessResponse] = await Promise.allSettled([
        apiClient.getHealthStatus(),
        apiClient.getReadinessStatus(),
      ]);

      let healthData = null;
      let readinessData = null;

      if (healthResponse.status === "fulfilled") {
        healthData = healthResponse.value;
      }

      if (readinessResponse.status === "fulfilled") {
        readinessData = readinessResponse.value;
      }

      return {
        health: healthData,
        readiness: readinessData,
        apiConnected: true,
      };
    } catch (error) {
      console.warn("Full health check failed:", error);
      return {
        health: null,
        readiness: null,
        apiConnected: false,
        error: error.message,
      };
    }
  }, []);

  // PERBAIKAN: Get system statistics
  const getSystemStats = useCallback(async () => {
    try {
      const [statsResponse, tempResponse] = await Promise.allSettled([
        apiClient.getSystemStats(),
        apiClient.getCurrentTemperature(),
      ]);

      let stats = {};
      let temperature = null;

      if (statsResponse.status === "fulfilled" && statsResponse.value.success) {
        stats = statsResponse.value.data;
      }

      if (tempResponse.status === "fulfilled" && tempResponse.value.success) {
        temperature = tempResponse.value;
      }

      return {
        ...stats,
        lastTemperature: temperature,
      };
    } catch (error) {
      console.warn("System stats check failed:", error);
      return {};
    }
  }, []);

  // PERBAIKAN: Perform health check with retry logic
  const performHealthCheck = useCallback(
    async (attempt = 1) => {
      if (!mountedRef.current) return;

      try {
        setHealthStatus((prev) => ({ ...prev, loading: true, error: null }));

        // Check API connectivity first
        const apiStatus = await checkApiHealth();

        if (!apiStatus.connected && attempt <= retryAttempts) {
          console.warn(`Health check attempt ${attempt} failed, retrying...`);

          retryTimeoutRef.current = setTimeout(() => {
            performHealthCheck(attempt + 1);
          }, retryDelay);

          return;
        }

        // Get comprehensive health data
        const { health, readiness, apiConnected, error } =
          await checkFullHealth();

        // Get system statistics
        const stats = await getSystemStats();

        if (!mountedRef.current) return;

        // Process health data
        const newHealthStatus = {
          overall: "unknown",
          database: { connected: false, status: "unknown" },
          mqtt: { connected: false, status: "unknown" },
          api: { connected: apiConnected, status: apiStatus.status },
          lastCheck: new Date().toISOString(),
          loading: false,
          error: error || null,
        };

        if (health?.success) {
          newHealthStatus.overall = health.data.status;
          newHealthStatus.database = {
            connected: health.data.database?.connected || false,
            status: health.data.database?.status || "unknown",
            latency: health.data.database?.latency,
          };
          newHealthStatus.mqtt = {
            connected: health.data.mqtt?.connected || false,
            status: health.data.mqtt?.status || "unknown",
            broker: health.data.mqtt?.broker,
            topic: health.data.mqtt?.topic,
          };
        }

        // Update states
        setHealthStatus(newHealthStatus);
        setSystemStats(stats);

        // Call status change callback
        if (onStatusChange) {
          onStatusChange(newHealthStatus, stats);
        }

        console.log("Health check completed:", {
          overall: newHealthStatus.overall,
          api: newHealthStatus.api.connected,
          database: newHealthStatus.database.connected,
          mqtt: newHealthStatus.mqtt.connected,
        });
      } catch (error) {
        if (!mountedRef.current) return;

        console.error("Health check failed:", error);

        const errorStatus = {
          overall: "error",
          database: { connected: false, status: "error" },
          mqtt: { connected: false, status: "error" },
          api: { connected: false, status: "error" },
          lastCheck: new Date().toISOString(),
          loading: false,
          error: error.message,
        };

        setHealthStatus(errorStatus);

        if (onStatusChange) {
          onStatusChange(errorStatus, {});
        }
      }
    },
    [
      checkApiHealth,
      checkFullHealth,
      getSystemStats,
      onStatusChange,
      retryAttempts,
      retryDelay,
    ]
  );

  // PERBAIKAN: Manual health check
  const refreshHealthCheck = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    performHealthCheck(1);
  }, [performHealthCheck]);

  // PERBAIKAN: Start/stop auto health checks
  const startAutoCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (enableAutoCheck && interval > 0) {
      intervalRef.current = setInterval(() => {
        performHealthCheck(1);
      }, interval);
    }
  }, [enableAutoCheck, interval, performHealthCheck]);

  const stopAutoCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // PERBAIKAN: Initialize health check
  useEffect(() => {
    mountedRef.current = true;

    // Perform initial health check
    performHealthCheck(1);

    // Start auto check if enabled
    startAutoCheck();

    return () => {
      mountedRef.current = false;
      stopAutoCheck();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [performHealthCheck, startAutoCheck, stopAutoCheck]);

  // PERBAIKAN: Update auto check when options change
  useEffect(() => {
    if (enableAutoCheck) {
      startAutoCheck();
    } else {
      stopAutoCheck();
    }
  }, [enableAutoCheck, interval, startAutoCheck, stopAutoCheck]);

  // PERBAIKAN: Get status color for UI
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "healthy":
      case "connected":
        return "green";
      case "degraded":
      case "warning":
        return "yellow";
      case "unhealthy":
      case "error":
      case "disconnected":
        return "red";
      default:
        return "gray";
    }
  }, []);

  // PERBAIKAN: Get status icon for UI
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case "healthy":
      case "connected":
        return "✅";
      case "degraded":
      case "warning":
        return "⚠️";
      case "unhealthy":
      case "error":
      case "disconnected":
        return "❌";
      default:
        return "⚪";
    }
  }, []);

  return {
    healthStatus,
    systemStats,
    refreshHealthCheck,
    startAutoCheck,
    stopAutoCheck,
    getStatusColor,
    getStatusIcon,
    isLoading: healthStatus.loading,
    hasError: !!healthStatus.error,
    isHealthy: healthStatus.overall === "healthy",
    isApiConnected: healthStatus.api.connected,
    isDatabaseConnected: healthStatus.database.connected,
    isMqttConnected: healthStatus.mqtt.connected,
  };
};

export default useHealthCheck;
