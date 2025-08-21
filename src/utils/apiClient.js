// PERBAIKAN: Comprehensive API client untuk backend baru

class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    this.token = null;

    // Initialize token from localStorage
    this.updateToken();
  }

  updateToken() {
    this.token = localStorage.getItem("authToken");
  }

  // PERBAIKAN: Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      defaultHeaders["Authorization"] = `Bearer ${this.token}`;
    }

    const requestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      // PERBAIKAN: Handle authentication errors
      if (response.status === 401) {
        this.handleAuthError();
        throw new Error("Authentication required. Please login again.");
      }

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  handleAuthError() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    this.token = null;

    // Redirect to login if not already there
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  // PERBAIKAN: Authentication methods
  async login(username, password) {
    return await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async register(username, email, password) {
    return await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch (error) {
      console.warn("Logout request failed:", error);
    }

    this.handleAuthError();
  }

  async getAuthInfo() {
    return await this.request("/auth/info");
  }

  async getCurrentUser() {
    this.updateToken();
    return await this.request("/auth/me");
  }

  async getUsers() {
    this.updateToken();
    return await this.request("/auth/users");
  }

  // PERBAIKAN: Sensor methods
  async getCurrentTemperature() {
    this.updateToken();
    return await this.request("/sensor/suhu");
  }

  async getTodayAggregateData() {
    this.updateToken();
    return await this.request("/sensor/aggregate/today");
  }

  async getSystemStatus() {
    this.updateToken();
    return await this.request("/sensor/system/status");
  }

  async getSystemStats() {
    this.updateToken();
    return await this.request("/sensor/stats");
  }

  // PERBAIKAN: Debug methods
  async forceProcessBuffer() {
    this.updateToken();
    return await this.request("/sensor/debug/process-buffer", {
      method: "POST",
    });
  }

  async forceProcessAggregate() {
    this.updateToken();
    return await this.request("/sensor/debug/process-aggregate", {
      method: "POST",
    });
  }

  async forceMqttReconnect() {
    this.updateToken();
    return await this.request("/sensor/debug/mqtt-reconnect", {
      method: "POST",
    });
  }

  // PERBAIKAN: Backup methods
  async getBackups() {
    this.updateToken();
    return await this.request("/backup");
  }

  async getBackupByDate(date) {
    this.updateToken();
    return await this.request(`/backup/${date}`);
  }

  async downloadBackup(type, date) {
    this.updateToken();
    const response = await fetch(
      `${this.baseURL}/backup/download/${type}/${date}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response; // Return response for download handling
  }

  async forceExport() {
    this.updateToken();
    return await this.request("/backup/export", {
      method: "POST",
    });
  }

  // PERBAIKAN: Health methods
  async getHealthStatus() {
    return await this.request("/health"); // Public endpoint
  }

  async getLivenessStatus() {
    return await this.request("/health/live"); // Public endpoint
  }

  async getReadinessStatus() {
    return await this.request("/health/ready"); // Public endpoint
  }

  // PERBAIKAN: Main status method
  async getMainStatus() {
    this.updateToken();
    return await this.request("/status");
  }

  // PERBAIKAN: Socket.IO helper (for WebSocket connections)
  getSocketURL() {
    return this.baseURL.replace("/api", "");
  }

  // PERBAIKAN: Download helper
  async handleDownload(response, filename) {
    try {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw new Error("Failed to download file");
    }
  }

  // PERBAIKAN: Utility methods
  async testConnection() {
    try {
      await this.getHealthStatus();
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  // PERBAIKAN: Emergency backup download
  async emergencyBackupDownload(date, type = "excel") {
    try {
      console.log(`Starting emergency backup download for ${date}`);

      const response = await this.downloadBackup(type, date);
      const filename = `emergency_backup_${date}.${
        type === "excel" ? "xlsx" : "csv"
      }`;

      await this.handleDownload(response, filename);

      console.log(`Emergency backup downloaded: ${filename}`);
      return { success: true, filename };
    } catch (error) {
      console.error("Emergency backup download failed:", error);
      throw error;
    }
  }

  // PERBAIKAN: Batch operations
  async getBatchSystemInfo() {
    this.updateToken();

    try {
      const [healthStatus, systemStats, temperatureData] =
        await Promise.allSettled([
          this.getHealthStatus(),
          this.getSystemStats(),
          this.getCurrentTemperature(),
        ]);

      return {
        health: healthStatus.status === "fulfilled" ? healthStatus.value : null,
        stats: systemStats.status === "fulfilled" ? systemStats.value : null,
        temperature:
          temperatureData.status === "fulfilled" ? temperatureData.value : null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Batch system info failed:", error);
      throw error;
    }
  }
}

// PERBAIKAN: Create singleton instance
const apiClient = new ApiClient();

// PERBAIKAN: Export both class and instance
export default apiClient;
export { ApiClient };

// PERBAIKAN: Named exports for common operations
export const api = {
  // Auth
  login: (username, password) => apiClient.login(username, password),
  register: (username, email, password) =>
    apiClient.register(username, email, password),
  logout: () => apiClient.logout(),
  getCurrentUser: () => apiClient.getCurrentUser(),

  // Sensor
  getTemperature: () => apiClient.getCurrentTemperature(),
  getTodayData: () => apiClient.getTodayAggregateData(),
  getSystemStatus: () => apiClient.getSystemStatus(),

  // Health
  getHealth: () => apiClient.getHealthStatus(),

  // Utils
  testConnection: () => apiClient.testConnection(),
  getBatchInfo: () => apiClient.getBatchSystemInfo(),
};
