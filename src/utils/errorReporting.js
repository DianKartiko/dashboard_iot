// PERBAIKAN: Comprehensive error reporting system

class ErrorReporter {
  constructor() {
    this.errorQueue = [];
    this.maxQueueSize = 100;
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // PERBAIKAN: Network status monitoring
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });

    // PERBAIKAN: Global error handling
    window.addEventListener("error", (event) => {
      this.reportError({
        type: "javascript_error",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
      });
    });

    // PERBAIKAN: Promise rejection handling
    window.addEventListener("unhandledrejection", (event) => {
      this.reportError({
        type: "promise_rejection",
        message: event.reason?.message || "Unhandled Promise Rejection",
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
      });
    });
  }

  // PERBAIKAN: Report error with context
  reportError(error, context = {}) {
    const errorReport = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      error: {
        ...error,
        context,
      },
      severity: this.determineSeverity(error),
      environment: import.meta.env.MODE,
    };

    // Add to queue
    this.addToQueue(errorReport);

    // Try to send immediately if online
    if (this.isOnline) {
      this.sendError(errorReport);
    }

    // Log to console in development
    if (import.meta.env.MODE === "development") {
      console.group(`🚨 Error Report [${errorReport.severity.toUpperCase()}]`);
      console.error("Error:", error);
      console.log("Context:", context);
      console.log("Full Report:", errorReport);
      console.groupEnd();
    }

    return errorReport.id;
  }

  // PERBAIKAN: API error reporting
  reportApiError(error, endpoint, method = "GET", requestData = null) {
    return this.reportError(
      {
        type: "api_error",
        message: error.message,
        endpoint,
        method,
        status: error.status || error.response?.status,
        requestData: this.sanitizeData(requestData),
        responseData: this.sanitizeData(error.response?.data),
      },
      {
        category: "api",
        endpoint,
        method,
      }
    );
  }

  // PERBAIKAN: Authentication error reporting
  reportAuthError(error, action) {
    return this.reportError(
      {
        type: "auth_error",
        message: error.message,
        action,
        tokenExists: !!localStorage.getItem("authToken"),
      },
      {
        category: "authentication",
        action,
      }
    );
  }

  // PERBAIKAN: Component error reporting
  reportComponentError(error, componentName, props = {}) {
    return this.reportError(
      {
        type: "component_error",
        message: error.message,
        stack: error.stack,
        componentName,
        props: this.sanitizeData(props),
      },
      {
        category: "component",
        componentName,
      }
    );
  }

  // PERBAIKAN: Performance error reporting
  reportPerformanceError(metric, threshold, actual) {
    return this.reportError(
      {
        type: "performance_error",
        message: `Performance threshold exceeded: ${metric}`,
        metric,
        threshold,
        actual,
        severity: actual > threshold * 2 ? "high" : "medium",
      },
      {
        category: "performance",
        metric,
      }
    );
  }

  // PERBAIKAN: User action error reporting
  reportUserActionError(action, error, userData = {}) {
    return this.reportError(
      {
        type: "user_action_error",
        message: error.message,
        action,
        userData: this.sanitizeData(userData),
      },
      {
        category: "user_action",
        action,
      }
    );
  }

  // PERBAIKAN: Add error to queue
  addToQueue(errorReport) {
    this.errorQueue.push(errorReport);

    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem("errorQueue", JSON.stringify(this.errorQueue));
    } catch (e) {
      console.warn("Failed to store error queue in localStorage:", e);
    }
  }

  // PERBAIKAN: Send error to backend
  async sendError(errorReport) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/errors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Error-Report": "true",
          },
          body: JSON.stringify(errorReport),
        }
      );

      if (response.ok) {
        this.removeFromQueue(errorReport.id);
      }
    } catch (sendError) {
      console.warn("Failed to send error report:", sendError);
    }
  }

  // PERBAIKAN: Flush error queue when online
  async flushErrorQueue() {
    if (!this.isOnline || this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];

    for (const error of errors) {
      await this.sendError(error);
    }
  }

  // PERBAIKAN: Remove error from queue
  removeFromQueue(errorId) {
    this.errorQueue = this.errorQueue.filter((error) => error.id !== errorId);

    try {
      localStorage.setItem("errorQueue", JSON.stringify(this.errorQueue));
    } catch (e) {
      console.warn("Failed to update error queue in localStorage:", e);
    }
  }

  // PERBAIKAN: Utility methods
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getUserId() {
    try {
      const user = JSON.parse(localStorage.getItem("authUser") || "{}");
      return user.id || "anonymous";
    } catch {
      return "anonymous";
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      sessionStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
  }

  determineSeverity(error) {
    if (error.type === "javascript_error" || error.type === "component_error") {
      return "high";
    }
    if (error.type === "api_error" && error.status >= 500) {
      return "high";
    }
    if (error.type === "auth_error") {
      return "medium";
    }
    return "low";
  }

  sanitizeData(data) {
    if (!data) return data;

    const sensitiveKeys = ["password", "token", "secret", "key", "auth"];
    const sanitized = JSON.parse(JSON.stringify(data));

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (
          sensitiveKeys.some((sensitive) =>
            key.toLowerCase().includes(sensitive)
          )
        ) {
          obj[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    if (typeof sanitized === "object") {
      sanitizeObject(sanitized);
    }

    return sanitized;
  }

  // PERBAIKAN: Get error statistics
  getErrorStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    const recentErrors = this.errorQueue.filter(
      (error) => now - new Date(error.timestamp).getTime() < oneHour
    );

    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.error.type] = (acc[error.error.type] || 0) + 1;
      return acc;
    }, {});

    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      total: this.errorQueue.length,
      recentCount: recentErrors.length,
      byType: errorsByType,
      bySeverity: errorsBySeverity,
      queueSize: this.errorQueue.length,
      maxQueueSize: this.maxQueueSize,
    };
  }

  // PERBAIKAN: Clear error queue
  clearErrorQueue() {
    this.errorQueue = [];
    localStorage.removeItem("errorQueue");
  }
}

// PERBAIKAN: Create singleton instance
const errorReporter = new ErrorReporter();

// PERBAIKAN: Export error reporting functions
export const reportError = (error, context) =>
  errorReporter.reportError(error, context);
export const reportApiError = (error, endpoint, method, requestData) =>
  errorReporter.reportApiError(error, endpoint, method, requestData);
export const reportAuthError = (error, action) =>
  errorReporter.reportAuthError(error, action);
export const reportComponentError = (error, componentName, props) =>
  errorReporter.reportComponentError(error, componentName, props);
export const reportPerformanceError = (metric, threshold, actual) =>
  errorReporter.reportPerformanceError(metric, threshold, actual);
export const reportUserActionError = (action, error, userData) =>
  errorReporter.reportUserActionError(action, error, userData);

export const getErrorStats = () => errorReporter.getErrorStats();
export const clearErrors = () => errorReporter.clearErrorQueue();

export default errorReporter;
