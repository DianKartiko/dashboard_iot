import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "../components/contexts/AuthContext";
import { reportAuthError } from "../utils/errorReporting";

// PERBAIKAN: Optimized token refresh hook
const useTokenRefresh = (options = {}) => {
  const {
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    warningThreshold = 10 * 60 * 1000, // 10 minutes before expiry
    enableAutoRefresh = true,
  } = options;

  const { token, verifyToken, logout } = useAuth();
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // PERBAIKAN: Parse JWT token without external library
  const parseJWT = useCallback((token) => {
    try {
      if (!token) return null;

      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.warn("Failed to parse JWT token:", error);
      return null;
    }
  }, []);

  // PERBAIKAN: Check token expiry
  const checkTokenExpiry = useCallback(() => {
    if (!token) return null;

    const payload = parseJWT(token);
    if (!payload || !payload.exp) return null;

    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    return {
      expiryTime,
      timeUntilExpiry,
      isExpired: timeUntilExpiry <= 0,
      isNearExpiry: timeUntilExpiry <= warningThreshold,
    };
  }, [token, parseJWT, warningThreshold]);

  // PERBAIKAN: Handle token refresh
  const handleTokenRefresh = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const tokenInfo = checkTokenExpiry();

      if (!tokenInfo) {
        console.warn("Unable to check token expiry");
        return;
      }

      if (tokenInfo.isExpired) {
        console.warn("Token has expired, logging out");
        reportAuthError(new Error("Token expired"), "auto_logout");
        await logout();
        return;
      }

      if (tokenInfo.isNearExpiry) {
        console.log("Token nearing expiry, verifying...");
        const isValid = await verifyToken();

        if (!isValid) {
          console.warn("Token verification failed");
          reportAuthError(
            new Error("Token verification failed"),
            "auto_refresh"
          );
          await logout();
        }
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      reportAuthError(error, "token_refresh");
    }
  }, [checkTokenExpiry, verifyToken, logout]);

  // PERBAIKAN: Schedule next refresh check
  const scheduleNextRefresh = useCallback(() => {
    if (!enableAutoRefresh || !token) return;

    const tokenInfo = checkTokenExpiry();
    if (!tokenInfo) return;

    let nextCheckInterval = refreshInterval;

    // If token is near expiry, check more frequently
    if (tokenInfo.isNearExpiry) {
      nextCheckInterval = Math.min(refreshInterval, 60000); // Check every minute
    }

    // If token expires soon, check very frequently
    if (tokenInfo.timeUntilExpiry < 2 * 60 * 1000) {
      // 2 minutes
      nextCheckInterval = 30000; // Check every 30 seconds
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      handleTokenRefresh();
    }, nextCheckInterval);
  }, [
    enableAutoRefresh,
    token,
    checkTokenExpiry,
    refreshInterval,
    handleTokenRefresh,
  ]);

  // PERBAIKAN: Setup auto refresh
  useEffect(() => {
    mountedRef.current = true;

    if (enableAutoRefresh && token) {
      // Initial check
      handleTokenRefresh();

      // Schedule periodic checks
      scheduleNextRefresh();
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [token, enableAutoRefresh, handleTokenRefresh, scheduleNextRefresh]);

  // PERBAIKAN: Manual token check
  const checkTokenNow = useCallback(async () => {
    await handleTokenRefresh();
  }, [handleTokenRefresh]);

  // PERBAIKAN: Get token status
  const getTokenStatus = useCallback(() => {
    if (!token) {
      return {
        hasToken: false,
        isValid: false,
        isExpired: false,
        isNearExpiry: false,
        timeUntilExpiry: null,
      };
    }

    const tokenInfo = checkTokenExpiry();
    return {
      hasToken: true,
      isValid: tokenInfo ? !tokenInfo.isExpired : false,
      isExpired: tokenInfo ? tokenInfo.isExpired : true,
      isNearExpiry: tokenInfo ? tokenInfo.isNearExpiry : true,
      timeUntilExpiry: tokenInfo ? tokenInfo.timeUntilExpiry : null,
      expiryTime: tokenInfo ? tokenInfo.expiryTime : null,
    };
  }, [token, checkTokenExpiry]);

  return {
    checkTokenNow,
    getTokenStatus,
    tokenStatus: getTokenStatus(),
  };
};

export default useTokenRefresh;
