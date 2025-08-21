import apiClient from "./apiClient";
import { ExportUtils } from "./exportToExcel";
import { reportError, reportUserActionError } from "./errorReporting";

// PERBAIKAN: Enhanced emergency backup system
class EmergencyBackupManager {
  constructor() {
    this.isBackupInProgress = false;
    this.backupHistory = this.loadBackupHistory();
    this.maxHistorySize = 50;
  }

  // PERBAIKAN: Load backup history from localStorage
  loadBackupHistory() {
    try {
      const history = localStorage.getItem("emergencyBackupHistory");
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn("Failed to load backup history:", error);
      return [];
    }
  }

  // PERBAIKAN: Save backup history to localStorage
  saveBackupHistory() {
    try {
      // Keep only latest entries
      if (this.backupHistory.length > this.maxHistorySize) {
        this.backupHistory = this.backupHistory.slice(-this.maxHistorySize);
      }

      localStorage.setItem(
        "emergencyBackupHistory",
        JSON.stringify(this.backupHistory)
      );
    } catch (error) {
      console.warn("Failed to save backup history:", error);
    }
  }

  // PERBAIKAN: Add entry to backup history
  addToHistory(entry) {
    this.backupHistory.push({
      ...entry,
      timestamp: new Date().toISOString(),
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    });
    this.saveBackupHistory();
  }

  // PERBAIKAN: Emergency data collection
  async collectEmergencyData() {
    const emergencyData = {
      timestamp: new Date().toISOString(),
      systemInfo: this.getSystemInfo(),
      userData: this.getUserData(),
      errors: [],
      data: {},
    };

    // Collect all available data with error handling
    const dataCollectors = [
      this.collectTemperatureData.bind(this),
      this.collectAggregateData.bind(this),
      this.collectSystemStats.bind(this),
      this.collectHealthStatus.bind(this),
      this.collectBackupList.bind(this),
    ];

    for (const collector of dataCollectors) {
      try {
        const result = await collector();
        Object.assign(emergencyData.data, result);
      } catch (error) {
        console.error("Data collection failed:", error);
        emergencyData.errors.push({
          collector: collector.name,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return emergencyData;
  }

  // PERBAIKAN: Collect temperature data
  async collectTemperatureData() {
    try {
      const [currentTemp, todayData] = await Promise.allSettled([
        apiClient.getCurrentTemperature(),
        apiClient.getTodayAggregateData(),
      ]);

      return {
        currentTemperature:
          currentTemp.status === "fulfilled" ? currentTemp.value : null,
        todayAggregate:
          todayData.status === "fulfilled" ? todayData.value : null,
      };
    } catch (error) {
      reportApiError(error, "/sensor/suhu", "GET");
      throw error;
    }
  }

  // PERBAIKAN: Collect aggregate data
  async collectAggregateData() {
    try {
      // Try to get last 7 days of data
      const aggregateData = await apiClient.getTodayAggregateData();
      return { aggregateData };
    } catch (error) {
      reportApiError(error, "/sensor/aggregate", "GET");
      throw error;
    }
  }

  // PERBAIKAN: Collect system statistics
  async collectSystemStats() {
    try {
      const [stats, status] = await Promise.allSettled([
        apiClient.getSystemStats(),
        apiClient.getSystemStatus(),
      ]);

      return {
        systemStats: stats.status === "fulfilled" ? stats.value : null,
        systemStatus: status.status === "fulfilled" ? status.value : null,
      };
    } catch (error) {
      reportApiError(error, "/sensor/stats", "GET");
      throw error;
    }
  }

  // PERBAIKAN: Collect health status
  async collectHealthStatus() {
    try {
      const [health, liveness, readiness] = await Promise.allSettled([
        apiClient.getHealthStatus(),
        apiClient.getLivenessStatus(),
        apiClient.getReadinessStatus(),
      ]);

      return {
        healthStatus: health.status === "fulfilled" ? health.value : null,
        livenessStatus: liveness.status === "fulfilled" ? liveness.value : null,
        readinessStatus:
          readiness.status === "fulfilled" ? readiness.value : null,
      };
    } catch (error) {
      reportApiError(error, "/health", "GET");
      throw error;
    }
  }

  // PERBAIKAN: Collect backup list
  async collectBackupList() {
    try {
      const backups = await apiClient.getBackups();
      return { availableBackups: backups };
    } catch (error) {
      reportApiError(error, "/backup", "GET");
      throw error;
    }
  }

  // PERBAIKAN: Get system information
  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  // PERBAIKAN: Get user data (sanitized)
  getUserData() {
    try {
      const authToken = localStorage.getItem("authToken");
      const authUser = localStorage.getItem("authUser");

      return {
        hasToken: !!authToken,
        tokenLength: authToken ? authToken.length : 0,
        user: authUser ? JSON.parse(authUser) : null,
        isAuthenticated: !!(authToken && authUser),
      };
    } catch (error) {
      return {
        hasToken: false,
        user: null,
        isAuthenticated: false,
        error: "Failed to parse user data",
      };
    }
  }

  // PERBAIKAN: Perform emergency backup
  async performEmergencyBackup(format = "excel", options = {}) {
    if (this.isBackupInProgress) {
      throw new Error("Emergency backup already in progress");
    }

    this.isBackupInProgress = true;
    const startTime = Date.now();

    try {
      console.log("🚨 Starting emergency backup...");

      // Collect all emergency data
      const emergencyData = await this.collectEmergencyData();

      // Prepare export data
      const exportData = this.prepareExportData(emergencyData);

      // Perform export
      let result;
      if (format === "excel") {
        result = await this.exportToExcel(exportData, options);
      } else {
        result = await this.exportToCSV(exportData, options);
      }

      const duration = Date.now() - startTime;

      // Add to history
      this.addToHistory({
        type: "emergency_backup",
        format,
        status: "success",
        duration,
        dataPoints: this.countDataPoints(emergencyData),
        errors: emergencyData.errors,
        filename: result.filename,
      });

      console.log(`✅ Emergency backup completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error("❌ Emergency backup failed:", error);

      // Add failed attempt to history
      this.addToHistory({
        type: "emergency_backup",
        format,
        status: "failed",
        duration,
        error: error.message,
      });

      reportUserActionError("emergency_backup", error, { format, duration });
      throw error;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  // PERBAIKAN: Prepare data for export
  prepareExportData(emergencyData) {
    const { data, systemInfo, userData, timestamp } = emergencyData;

    // Prepare system overview
    const systemOverview = [
      { metric: "Backup Date", value: new Date(timestamp).toLocaleString() },
      {
        metric: "System Status",
        value: data.healthStatus?.data?.status || "Unknown",
      },
      { metric: "User", value: userData.user?.username || "Anonymous" },
      { metric: "Browser", value: systemInfo.userAgent },
      {
        metric: "Online Status",
        value: systemInfo.onLine ? "Online" : "Offline",
      },
    ];

    // Prepare temperature data
    const temperatureData = [];
    if (data.currentTemperature?.data) {
      temperatureData.push({
        timestamp: data.currentTemperature.data.timestamp,
        temperature: data.currentTemperature.data.suhu,
        status: data.currentTemperature.data.status,
        type: "current",
      });
    }

    // Prepare aggregate data
    const aggregateData = data.todayAggregate?.data || [];

    // Prepare system stats
    const statsData = [];
    if (data.systemStats?.data) {
      const stats = data.systemStats.data;
      Object.entries(stats).forEach(([key, value]) => {
        statsData.push({ metric: key, value: value?.toString() || "N/A" });
      });
    }

    return {
      systemOverview,
      temperatureData,
      aggregateData,
      statsData,
      metadata: {
        emergencyData,
        exportTimestamp: new Date().toISOString(),
      },
    };
  }

  // PERBAIKAN: Export to Excel
  async exportToExcel(exportData, options = {}) {
    const { systemOverview, temperatureData, aggregateData, statsData } =
      exportData;

    const sheetsData = [
      {
        name: "Emergency Overview",
        data: systemOverview,
      },
      {
        name: "Current Temperature",
        data: temperatureData,
        formatters: {
          timestamp: (value) => new Date(value).toLocaleString(),
          temperature: (value) => `${parseFloat(value || 0).toFixed(2)}°C`,
        },
      },
      {
        name: "Daily Aggregates",
        data: aggregateData,
        formatters: {
          date: (value) => new Date(value).toLocaleDateString(),
          avgTemp: (value) => `${parseFloat(value || 0).toFixed(2)}°C`,
          minTemp: (value) => `${parseFloat(value || 0).toFixed(2)}°C`,
          maxTemp: (value) => `${parseFloat(value || 0).toFixed(2)}°C`,
        },
      },
      {
        name: "System Statistics",
        data: statsData,
      },
    ];

    return ExportUtils.exportToExcel(sheetsData, "emergency_backup", {
      multipleSheets: true,
      includeTimestamp: true,
      ...options,
    });
  }

  // PERBAIKAN: Export to CSV
  async exportToCSV(exportData, options = {}) {
    const { aggregateData } = exportData;

    // Export aggregate data as primary CSV
    return ExportUtils.exportToCSV(aggregateData, "emergency_backup", {
      includeTimestamp: true,
      formatters: {
        date: (value) => new Date(value).toLocaleDateString(),
        avgTemp: (value) => `${parseFloat(value || 0).toFixed(2)}°C`,
        minTemp: (value) => `${parseFloat(value || 0).toFixed(2)}°C`,
        maxTemp: (value) => `${parseFloat(value || 0).toFixed(2)}°C`,
      },
      ...options,
    });
  }

  // PERBAIKAN: Count data points for statistics
  countDataPoints(emergencyData) {
    const { data } = emergencyData;
    let count = 0;

    if (data.currentTemperature) count += 1;
    if (data.todayAggregate?.data) count += data.todayAggregate.data.length;
    if (data.aggregateData?.data) count += data.aggregateData.data.length;

    return count;
  }

  // PERBAIKAN: Get backup history
  getBackupHistory() {
    return [...this.backupHistory].reverse(); // Most recent first
  }

  // PERBAIKAN: Clear backup history
  clearBackupHistory() {
    this.backupHistory = [];
    localStorage.removeItem("emergencyBackupHistory");
  }

  // PERBAIKAN: Get backup statistics
  getBackupStats() {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    const recentBackups = this.backupHistory.filter(
      (backup) => now - new Date(backup.timestamp) < oneWeek
    );

    const todayBackups = this.backupHistory.filter(
      (backup) => now - new Date(backup.timestamp) < oneDay
    );

    const successfulBackups = this.backupHistory.filter(
      (backup) => backup.status === "success"
    );

    return {
      total: this.backupHistory.length,
      successful: successfulBackups.length,
      failed: this.backupHistory.length - successfulBackups.length,
      recentCount: recentBackups.length,
      todayCount: todayBackups.length,
      lastBackup: this.backupHistory[this.backupHistory.length - 1] || null,
      avgDuration:
        successfulBackups.length > 0
          ? successfulBackups.reduce((sum, b) => sum + (b.duration || 0), 0) /
            successfulBackups.length
          : 0,
    };
  }

  // PERBAIKAN: Check if backup is needed
  shouldPerformBackup() {
    const lastBackup = this.backupHistory[this.backupHistory.length - 1];
    if (!lastBackup) return true;

    const timeSinceLastBackup =
      Date.now() - new Date(lastBackup.timestamp).getTime();
    const oneHour = 60 * 60 * 1000;

    return timeSinceLastBackup > oneHour;
  }
}

// PERBAIKAN: Create singleton instance
const emergencyBackupManager = new EmergencyBackupManager();

// PERBAIKAN: Export functions
export const performEmergencyBackup = (format, options) =>
  emergencyBackupManager.performEmergencyBackup(format, options);

export const getBackupHistory = () => emergencyBackupManager.getBackupHistory();
export const getBackupStats = () => emergencyBackupManager.getBackupStats();
export const clearBackupHistory = () =>
  emergencyBackupManager.clearBackupHistory();
export const shouldPerformBackup = () =>
  emergencyBackupManager.shouldPerformBackup();

export default emergencyBackupManager;
