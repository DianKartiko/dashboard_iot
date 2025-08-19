import React, { useState, useEffect, useRef } from "react";
import { Database, TrendingUp, Clock, Calendar } from "lucide-react";
import StatsCard from "../molecules/StatsCard";
import ExportControls from "../molecules/ExportControls";
import TemperatureAggregateTable from "../organism/TemperatureAggregateTable";

// MessageModal Component (Missing component)
const MessageModal = ({ message, type, onClose }) => {
  const bgColor = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  return (
    <div className={`p-4 rounded-lg border mb-4 ${bgColor[type] || bgColor.info}`}>
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const TemperatureAggregateDashboard = () => {
  const [aggregateData, setAggregateData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [stats, setStats] = useState({
    totalRecords: 0,
    avgTemp: 0,
    minTemp: 0,
    maxTemp: 0,
    trend: 0,
    aggregatesReady: 0,
  });
  const [message, setMessage] = useState(null);

  const intervalRef = useRef();
  const exportCheckRef = useRef();

  const handleMessage = (msg, type = "info") => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchAggregateData = async () => {
    try {
      console.log("🔄 Fetching aggregate data from Prisma...");
      const response = await fetch(
        "http://localhost:5000/api/sensor/aggregate/today"
      );
      const result = await response.json();

      if (result.success && result.data && result.data.aggregates) {
        const aggregates = result.data.aggregates;
        setAggregateData(aggregates);
        if (aggregates.length > 0) {
          const allMeans = aggregates.map((a) => a.meanTemp);
          const allMins = aggregates.map((a) => a.minTemp);
          const allMaxs = aggregates.map((a) => a.maxTemp);
          const notExported = aggregates.filter((a) => !a.isExported);

          setStats({
            totalRecords: aggregates.length,
            avgTemp:
              allMeans.reduce((sum, temp) => sum + temp, 0) / allMeans.length,
            minTemp: Math.min(...allMins),
            maxTemp: Math.max(...allMaxs),
            trend:
              allMeans.length > 1
                ? ((allMeans[0] - allMeans[allMeans.length - 1]) /
                    allMeans[allMeans.length - 1]) *
                  100
                : 0,
            aggregatesReady: notExported.length,
          });
        }
        console.log(`✅ Loaded ${aggregates.length} aggregate records`);
      } else {
        console.warn("⚠️ No aggregate data found for today");
        setAggregateData([]);
      }
    } catch (error) {
      console.error("❌ Error fetching aggregate data:", error);
      setAggregateData([]);
      handleMessage("Gagal memuat data agregat.", "error");
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/system/status");
      const result = await response.json();
      if (result.success) {
        setSystemStatus(result.data);
      }
    } catch (error) {
      console.error("❌ Error fetching system status:", error);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    if (aggregateData.length === 0) {
      handleMessage("Tidak ada data untuk diekspor.", "error");
      setIsExporting(false);
      return;
    }
    try {
      const headers = [
        "ID",
        "Date",
        "Time Slot",
        "Mean Temperature (°C)",
        "Min Temperature (°C)",
        "Max Temperature (°C)",
        "Sample Count",
        "Created At",
        "Export Status",
      ];
      const csvContent = [
        headers.join(","),
        ...aggregateData.map((record) =>
          [
            record.id,
            new Date(record.date).toLocaleDateString("id-ID"),
            record.timeSlot,
            record.meanTemp.toFixed(2),
            record.minTemp.toFixed(2),
            record.maxTemp.toFixed(2),
            record.sampleCount,
            new Date(record.createdAt || record.date).toISOString(),
            record.isExported ? "Exported" : "Pending",
          ].join(",")
        ),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const fileName = `temperature_aggregates_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      setLastExport(new Date().toISOString());
      handleMessage("Ekspor CSV berhasil!", "info");
    } catch (error) {
      console.error("❌ Error exporting CSV:", error);
      handleMessage("Terjadi kesalahan saat mengekspor CSV.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    if (aggregateData.length === 0) {
      handleMessage("Tidak ada data untuk diekspor.", "error");
      setIsExporting(false);
      return;
    }
    try {
      const jsonData = aggregateData.map((record) => ({
        ID: record.id,
        Date: new Date(record.date).toLocaleDateString("id-ID"),
        "Time Slot": record.timeSlot,
        "Mean Temperature (°C)": record.meanTemp.toFixed(2),
        "Min Temperature (°C)": record.minTemp.toFixed(2),
        "Max Temperature (°C)": record.maxTemp.toFixed(2),
        "Sample Count": record.sampleCount,
        "Created At": new Date(record.createdAt || record.date).toISOString(),
        "Export Status": record.isExported ? "Exported" : "Pending",
      }));
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      const fileName = `temperature_aggregates_${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      setLastExport(new Date().toISOString());
      handleMessage("Ekspor Excel/JSON berhasil!", "info");
    } catch (error) {
      console.error("❌ Error exporting Excel:", error);
      handleMessage("Terjadi kesalahan saat mengekspor Excel/JSON.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const checkAutoExport = () => {
    const now = new Date();
    if (
      now.getHours() === 0 &&
      now.getMinutes() === 1 &&
      aggregateData.length > 0
    ) {
      console.log("🕛 Auto-exporting daily aggregate data...");
      exportToCSV();
      exportToExcel();
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([fetchAggregateData(), fetchSystemStatus()]);
      setIsLoading(false);
    };

    initializeData();
    intervalRef.current = setInterval(() => {
      fetchAggregateData();
      fetchSystemStatus();
    }, 10 * 60 * 1000);

    exportCheckRef.current = setInterval(checkAutoExport, 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (exportCheckRef.current) clearInterval(exportCheckRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto p-4 my-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Temperature Aggregate Report
          </h1>
          <p className="text-gray-600 mt-2 dark:text-gray-300">
            Data agregasi suhu dari Prisma Database • Interval 10 menit •
            Auto-export harian
          </p>
          {systemStatus && (
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    systemStatus.databaseBuffer > 0
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                ></div>
                DB Buffer: {systemStatus.databaseBuffer}
              </span>
              <span className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    systemStatus.pendingAggregates > 0
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                ></div>
                Pending Aggregates: {systemStatus.pendingAggregates}
              </span>
            </div>
          )}
        </div>

        {message && (
          <MessageModal
            message={message.text}
            type={message.type}
            onClose={() => setMessage(null)}
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Aggregate Records"
            value={stats.totalRecords}
            icon={Database}
          />
          <StatsCard
            title="Average Temperature"
            value={`${stats.avgTemp.toFixed(1)}°C`}
            icon={TrendingUp}
            trend={stats.trend.toFixed(1)}
          />
          <StatsCard
            title="Temperature Range"
            value={`${stats.minTemp.toFixed(1)} - ${stats.maxTemp.toFixed(
              1
            )}°C`}
            icon={Clock}
          />
          <StatsCard
            title="Ready for Export"
            value={stats.aggregatesReady}
            icon={Calendar}
          />
        </div>

        {/* Export Controls */}
        <div className="mb-6">
          <ExportControls
            onExportCSV={exportToCSV}
            onExportExcel={exportToExcel}
            isExporting={isExporting}
            recordCount={aggregateData.length}
            lastExport={lastExport}
            autoExportStatus="scheduled"
          />
        </div>

        {/* Temperature Aggregate Table */}
        <TemperatureAggregateTable
          data={aggregateData}
          isLoading={isLoading}
          systemStatus={systemStatus}
        />

        {/* System Info Footer */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            System Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Database Status */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">
                Database Status
              </h5>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Buffer Records:</span>
                  <span className="font-mono">
                    {systemStatus?.databaseBuffer || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processed Buffer:</span>
                  <span className="font-mono">
                    {systemStatus?.processedBuffer || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Aggregate Records:</span>
                  <span className="font-mono">{aggregateData.length}</span>
                </div>
              </div>
            </div>

            {/* Export Status */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">
                Export Status
              </h5>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ready for Export:</span>
                  <span className="font-mono text-yellow-600">
                    {stats.aggregatesReady}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Export:</span>
                  <span className="font-mono text-xs">
                    {lastExport
                      ? new Date(lastExport).toLocaleString("id-ID")
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Next Auto Export:</span>
                  <span className="font-mono text-xs">Daily at 00:01</span>
                </div>
              </div>
            </div>

            {/* Data Collection Info */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">
                Data Collection
              </h5>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Collection Interval:</span>
                  <span className="font-mono">10 minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Aggregation Method:</span>
                  <span className="font-mono">Mean, Median, Mode</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Data Retention:</span>
                  <span className="font-mono">Until exported</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureAggregateDashboard;