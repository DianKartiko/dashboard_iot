import React, { useState, useEffect, useRef } from "react";
import { Database, TrendingUp, Clock, Calendar, Sun, Moon } from "lucide-react";
import StatsCard from "../molecules/StatsCard";
import ExportControls from "../molecules/ExportControls";
import TemperatureAggregateTable from "../organism/TemperatureAggregateTable";
import ButtonData from "../atoms/ButtonData";

// // Dark Mode Toggle Component
// const DarkModeToggle = ({ darkMode, setDarkMode }) => {
//   return (
//     <ButtonData
//       variant="outline"
//       size="sm"
//       onClick={() => setDarkMode(!darkMode)}
//       icon={darkMode ? Sun : Moon}
//       className="fixed top-4 right-4 z-50 shadow-lg"
//     >
//       <span className="hidden sm:inline">
//         {darkMode ? "Light" : "Dark"} Mode
//       </span>
//     </ButtonData>
//   );
// };

// MessageModal Component
const MessageModal = ({ message, type, onClose }) => {
  const bgColor = {
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
    error:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
    success:
      "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200",
  };

  return (
    <div
      className={`p-3 sm:p-4 rounded-lg border mb-4 shadow-sm ${
        bgColor[type] || bgColor.info
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
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
  // const [darkMode, setDarkMode] = useState(false);
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

  // Dark mode effect
  // useEffect(() => {
  //   if (darkMode) {
  //     document.documentElement.classList.add("dark");
  //   } else {
  //     document.documentElement.classList.remove("dark");
  //   }
  // }, [darkMode]);

  // Initialize dark mode from system preference
  // useEffect(() => {
  //   const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  //   setDarkMode(mediaQuery.matches);

  //   const handleChange = (e) => setDarkMode(e.matches);
  //   mediaQuery.addEventListener("change", handleChange);

  //   return () => mediaQuery.removeEventListener("change", handleChange);
  // }, []);

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
        "Rata-Rata Temperature (°C)",
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
      handleMessage("Ekspor CSV berhasil!", "success");
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
      handleMessage("Ekspor Excel/JSON berhasil!", "success");
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Dark Mode Toggle */}
      {/* <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} /> */}

      <div className="container mx-auto p-3 sm:p-4 lg:p-6 pt-4 sm:pt-4 my-4 rounded-lg">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-start sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Temperature Aggregate Report
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
              Data agregasi suhu dari Prisma Database • Interval 10 menit •
              Auto-export harian
            </p>
          </div>

          {systemStatus && (
            <div className="mt-4 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                System Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      systemStatus.databaseBuffer > 0
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    DB Buffer:{" "}
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                      {systemStatus.databaseBuffer}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      systemStatus.pendingAggregates > 0
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  ></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Pending:{" "}
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                      {systemStatus.pendingAggregates}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Records:{" "}
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                      {aggregateData.length}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Ready:{" "}
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                      {stats.aggregatesReady}
                    </span>
                  </span>
                </div>
              </div>
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
        <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
          <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            System Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Database Status */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
                Database Status
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Buffer Records:
                  </span>
                  <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                    {systemStatus?.databaseBuffer || 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Processed Buffer:
                  </span>
                  <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                    {systemStatus?.processedBuffer || 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Aggregate Records:
                  </span>
                  <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                    {aggregateData.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Export Status */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
                Export Status
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Ready for Export:
                  </span>
                  <span className="font-mono font-medium text-yellow-600 dark:text-yellow-400">
                    {stats.aggregatesReady}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Last Export:
                  </span>
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    {lastExport
                      ? new Date(lastExport).toLocaleString("id-ID")
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Next Auto Export:
                  </span>
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    Daily at 00:01
                  </span>
                </div>
              </div>
            </div>

            {/* Data Collection Info */}
            <div className="space-y-3 md:col-span-2 lg:col-span-1">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
                Data Collection
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Collection Interval:
                  </span>
                  <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                    10 minutes
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Aggregation Method:
                  </span>
                  <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                    Mean, Median, Mode
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Data Retention:
                  </span>
                  <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                    Until exported
                  </span>
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
