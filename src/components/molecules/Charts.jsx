import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function Charts() {
  // State untuk LineChart (data 10 menit)
  const [chartData, setChartData] = useState([]);

  // State untuk BarChart (data harian)
  const [dailyData, setDailyData] = useState([]);

  // State untuk current temperature
  const [currentTemp, setCurrentTemp] = useState(null);

  // State untuk loading dan error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // State untuk connection status
  const [isConnected, setIsConnected] = useState(false);

  // === fetchTodayAggregateData (LineChart, 10 menit interval) ===
  const fetchTodayAggregateData = async () => {
    try {
      // PERBAIKAN: Gunakan endpoint yang benar
      const response = await fetch(
        "http://localhost:5000/api/sensor/aggregate/today"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Aggregate response:", result);

      if (result.success && result.data && result.data.aggregates) {
        const aggregates = result.data.aggregates;

        if (aggregates.length > 0) {
          // Format data dari database aggregate
          const formattedData = aggregates.map((item, index) => ({
            time: item.timeSlot,
            temperature: parseFloat(item.meanTemp),
            minTemp: parseFloat(item.minTemp),
            maxTemp: parseFloat(item.maxTemp),
            sampleCount: item.sampleCount,
            // Tambah data untuk area chart
            tempRange: parseFloat(item.maxTemp) - parseFloat(item.minTemp),
          }));

          setChartData(formattedData);
          setIsConnected(true);
          setError(null);
          setLastUpdate(new Date());

          console.log("✅ Real data loaded:", formattedData);
          return;
        }
      }

      // Jika tidak ada data agregasi, coba ambil dari buffer real-time
      await fetchRealtimeStats();
    } catch (err) {
      console.error("❌ Error fetch aggregate today:", err);
      setError("Gagal mengambil data agregasi");
      setIsConnected(false);

      // Fallback ke realtime stats jika aggregate gagal
      await fetchRealtimeStats();
    }
  };

  // PERBAIKAN: Tambahkan fungsi untuk mengambil real-time stats
  const fetchRealtimeStats = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/sensor/realtime/stats"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Realtime stats:", result);

      if (result.success && result.data && result.data.dataPoints) {
        const dataPoints = result.data.dataPoints;

        if (dataPoints.length > 0) {
          // Format data dari realtime buffer
          const formattedData = dataPoints.slice(-10).map((point, index) => {
            const time = new Date(point.timestamp);
            const timeString = `${time
              .getHours()
              .toString()
              .padStart(2, "0")}:${time
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;

            return {
              time: timeString,
              temperature: parseFloat(point.temperature),
              minTemp: parseFloat(point.temperature) - 1, // Estimasi range
              maxTemp: parseFloat(point.temperature) + 1,
              sampleCount: 1,
              tempRange: 2,
            };
          });

          setChartData(formattedData);
          setCurrentTemp(result.data.currentTemp);
          setIsConnected(true);
          setError(null);
          setLastUpdate(new Date());

          console.log("✅ Realtime data loaded:", formattedData);
          return;
        }
      }

      // Terakhir, fallback ke current temperature
      await fetchCurrentTemperature();
    } catch (err) {
      console.error("❌ Error fetching realtime stats:", err);
      await generateFallbackData();
    }
  };

  // Fetch current temperature dari endpoint yang ada
  const fetchCurrentTemperature = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/sensor/current");

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const newTemp = parseFloat(result.data.temperature);
          setCurrentTemp(newTemp);
          setIsConnected(true);

          // Jika tidak ada chart data, buat dari current temp
          if (chartData.length === 0) {
            await generateFallbackData(newTemp);
          }
          return;
        }
      }

      // Fallback ke endpoint lama
      const fallbackResponse = await fetch("http://localhost:5000/api/suhu");
      const fallbackData = await fallbackResponse.json();

      if (fallbackData.suhu) {
        const newTemp = parseFloat(fallbackData.suhu);
        setCurrentTemp(newTemp);
        setIsConnected(true);

        if (chartData.length === 0) {
          await generateFallbackData(newTemp);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching current temperature:", err);
      setIsConnected(false);
      await generateFallbackData();
    }
  };

  // Generate fallback data jika semua endpoint gagal
  const generateFallbackData = async (baseTemp = 25) => {
    try {
      const now = new Date();
      const fallbackData = [];

      for (let i = 9; i >= 0; i--) {
        const slotTime = new Date(now.getTime() - i * 10 * 60 * 1000);
        const hour = slotTime.getHours().toString().padStart(2, "0");
        const minute = (Math.floor(slotTime.getMinutes() / 10) * 10)
          .toString()
          .padStart(2, "0");
        const timeSlot = `${hour}:${minute}`;

        const tempVariation = (Math.random() - 0.5) * 4;
        const temperature = Math.max(0, baseTemp + tempVariation);

        fallbackData.push({
          time: timeSlot,
          temperature: Math.round(temperature * 10) / 10,
          minTemp: Math.round((temperature - 2) * 10) / 10,
          maxTemp: Math.round((temperature + 2) * 10) / 10,
          sampleCount: Math.floor(Math.random() * 10) + 1,
          tempRange: 4,
        });
      }

      setChartData(fallbackData);
      setError("Menggunakan data simulasi - Periksa koneksi database");
      console.log("⚠️ Using fallback data:", fallbackData);
    } catch (err) {
      console.error("Error generating fallback data:", err);
      setError("Gagal memuat data");
    }
  };

  // === fetchHistoricalData (BarChart, rata-rata harian) ===
  const fetchHistoricalData = async () => {
    try {
      const dailyAverages = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);
        const dateString = targetDate.toISOString().split("T")[0];

        try {
          const response = await fetch(
            `http://localhost:5000/api/sensor/history/${dateString}`
          );
          const result = await response.json();

          let avgTemp = 0;
          let minTemp = 0;
          let maxTemp = 0;

          const dayLabel = targetDate.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "2-digit",
          });

          if (result.success && result.data) {
            if (result.data.source === "backup" && result.data.backup) {
              avgTemp = result.data.backup.avgDailyTemp;
              minTemp = result.data.backup.minDailyTemp;
              maxTemp = result.data.backup.maxDailyTemp;
            } else if (
              result.data.source === "aggregate" &&
              result.data.aggregates
            ) {
              const temps = result.data.aggregates.map((item) => item.meanTemp);
              const mins = result.data.aggregates.map((item) => item.minTemp);
              const maxs = result.data.aggregates.map((item) => item.maxTemp);

              avgTemp =
                temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
              minTemp = Math.min(...mins);
              maxTemp = Math.max(...maxs);

              avgTemp = Math.round(avgTemp * 100) / 100;
            }
          }

          // Fallback untuk hari ini jika tidak ada data
          if (avgTemp === 0 && i === 0 && currentTemp > 0) {
            avgTemp = currentTemp;
            minTemp = currentTemp - 2;
            maxTemp = currentTemp + 2;
          }

          dailyAverages.push({
            time: dayLabel,
            temperature: avgTemp || 0,
            minTemp: minTemp || 0,
            maxTemp: maxTemp || 0,
          });
        } catch (dayError) {
          console.warn(`Error fetching data for ${dateString}:`, dayError);

          const dayLabel = targetDate.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "2-digit",
          });

          dailyAverages.push({
            time: dayLabel,
            temperature: 0,
            minTemp: 0,
            maxTemp: 0,
          });
        }
      }

      setDailyData(dailyAverages);
    } catch (err) {
      console.error("❌ Error fetching historical data:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch data secara berurutan
        await fetchCurrentTemperature();
        await fetchTodayAggregateData();
        await fetchHistoricalData();
      } catch (err) {
        setError("Gagal memuat data dashboard");
        console.error("Error in initial fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Update real-time data setiap 10 detik
  useEffect(() => {
    const realtimeInterval = setInterval(() => {
      fetchCurrentTemperature();
      fetchTodayAggregateData();
    }, 10000); // 10 detik

    return () => clearInterval(realtimeInterval);
  }, []);

  // Update historical data setiap 5 menit
  useEffect(() => {
    const historicalInterval = setInterval(() => {
      fetchHistoricalData();
    }, 300000); // 5 menit

    return () => clearInterval(historicalInterval);
  }, []);

  // Custom tooltip untuk LineChart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            {`Waktu: ${label}`}
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            {`Suhu: ${data.temperature}°C`}
          </p>
          <p className="text-red-500 text-sm">{`Max: ${data.maxTemp}°C`}</p>
          <p className="text-green-500 text-sm">{`Min: ${data.minTemp}°C`}</p>
          <p className="text-gray-500 text-xs">
            {`Samples: ${data.sampleCount}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-full mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Status Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border border-blue-100 dark:border-gray-600">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            {currentTemp && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Current:{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {currentTemp}°C
                </span>
              </div>
            )}
          </div>
          {lastUpdate && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
        {error && (
          <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Line Chart - Real-time Data */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Real-time Temperature
            </h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Live
              </span>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  dark:stroke="#374151"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#tempGradient)"
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 6, fill: "#1d4ed8" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Data points: {chartData.length}</span>
              {chartData.length > 0 && (
                <span>
                  Range: {Math.min(...chartData.map((d) => d.minTemp))}°C -{" "}
                  {Math.max(...chartData.map((d) => d.maxTemp))}°C
                </span>
              )}
            </div>
            <div>Updates every 10 seconds • 10-minute intervals</div>
          </div>
        </div>

        {/* Bar Chart - Historical Data */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Weekly Average
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last 7 days
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  formatter={(value, name) => [
                    `${Math.round(value * 10) / 10}°C`,
                    name === "temperature" ? "Average" : name,
                  ]}
                  labelFormatter={(label) => `Day: ${label}`}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="temperature"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Avg Temperature"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Daily averages • Updates every 5 minutes
          </div>
        </div>
      </div>

      {/* Data Summary Cards */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
          {[
            {
              label: "Today Max",
              value: Math.max(...chartData.map((d) => d.maxTemp)),
              unit: "°C",
              color: "text-pink-300",
            },
            {
              label: "Today Min",
              value: Math.min(...chartData.map((d) => d.minTemp)),
              unit: "°C",
              color: "text-teal-300",
            },
            {
              label: "Avg Today",
              value:
                Math.round(
                  (chartData.reduce((sum, d) => sum + d.temperature, 0) /
                    chartData.length) *
                    10
                ) / 10,
              unit: "°C",
              color: "text-purple-300",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {stat.label}
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
                {stat.unit}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
