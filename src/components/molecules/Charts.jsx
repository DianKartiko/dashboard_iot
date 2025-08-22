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
      // PERBAIKAN: Gunakan endpoint public yang tersedia
      const response = await fetch(
        "http://localhost:3000/api/sensor/aggregate/public",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Aggregate response:", result);

      if (result.success && result.data && result.data.length > 0) {
        // Format data dari database aggregate
        const formattedData = result.data.slice(-10).map((item, index) => ({
          time: new Date(item.timeSlot).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          temperature: parseFloat(item.meanTemp),
          minTemp: parseFloat(item.minTemp),
          maxTemp: parseFloat(item.maxTemp),
          sampleCount: item.sampleCount,
          tempRange: parseFloat(item.maxTemp) - parseFloat(item.minTemp),
        }));

        setChartData(formattedData);
        setIsConnected(true);
        setError(null);
        setLastUpdate(new Date());

        console.log("✅ Real aggregate data loaded:", formattedData);
        return;
      }

      // Jika tidak ada data agregasi, coba ambil dari current
      await fetchCurrentTemperature();
    } catch (err) {
      console.error("❌ Error fetch aggregate today:", err);
      setError(`Gagal mengambil data agregasi: ${err.message}`);
      setIsConnected(false);

      // Fallback ke current temperature jika aggregate gagal
      await fetchCurrentTemperature();
    }
  };

  // PERBAIKAN: Fetch current temperature tanpa auth
  const fetchCurrentTemperature = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/sensor/current", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Current temperature:", result);

        if (result.success && result.data) {
          const sensorsData = result.data;
          const currentSensor =
            sensorsData["1"] || sensorsData[Object.keys(sensorsData)[0]];

          if (currentSensor) {
            const currentTempValue = currentSensor.suhu || 0;
            setCurrentTemp(currentTempValue);

            // Generate simulasi data chart berdasarkan current temp
            const now = new Date();
            const simulatedData = [];

            for (let i = 9; i >= 0; i--) {
              const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5 menit interval
              const baseTemp = currentTempValue;
              const variation = (Math.random() - 0.5) * 4; // ±2°C variation
              const temp = Math.max(0, baseTemp + variation);

              simulatedData.push({
                time: time.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }),
                temperature: Math.round(temp * 100) / 100,
                minTemp: Math.round((temp - 1) * 100) / 100,
                maxTemp: Math.round((temp + 1) * 100) / 100,
                sampleCount: 1,
                tempRange: 2,
              });
            }

            setChartData(simulatedData);
            setIsConnected(!result.usingSimulation);
            setError(result.usingSimulation ? "Using simulation data" : null);
            setLastUpdate(new Date());

            console.log("✅ Current temperature data loaded");
            return;
          }
        }
      }

      // Jika semua gagal, generate dummy data
      await generateFallbackData();
    } catch (err) {
      console.error("❌ Error fetching current temperature:", err);
      await generateFallbackData();
    }
  };

  // === fetchDailyData (BarChart, data per hari) ===
  const fetchDailyData = async () => {
    try {
      // PERBAIKAN: Gunakan endpoint public untuk daily data
      const response = await fetch(
        "http://localhost:3000/api/sensor/aggregate/public",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          // Group data by date untuk daily chart
          const dailyGroups = {};

          result.data.forEach((item) => {
            const date = new Date(item.timeSlot).toLocaleDateString();
            if (!dailyGroups[date]) {
              dailyGroups[date] = {
                date: date,
                avgTemp: 0,
                minTemp: Infinity,
                maxTemp: -Infinity,
                count: 0,
                totalTemp: 0,
              };
            }

            const group = dailyGroups[date];
            group.totalTemp += parseFloat(item.meanTemp);
            group.count += 1;
            group.minTemp = Math.min(group.minTemp, parseFloat(item.minTemp));
            group.maxTemp = Math.max(group.maxTemp, parseFloat(item.maxTemp));
          });

          // Convert ke array dan hitung rata-rata
          const dailyArray = Object.values(dailyGroups)
            .map((group) => ({
              date: group.date,
              avgTemp: Math.round((group.totalTemp / group.count) * 100) / 100,
              minTemp: Math.round(group.minTemp * 100) / 100,
              maxTemp: Math.round(group.maxTemp * 100) / 100,
            }))
            .slice(-7); // Ambil 7 hari terakhir

          setDailyData(dailyArray);
          console.log("✅ Daily data loaded:", dailyArray);
          return;
        }
      }

      // Fallback: generate daily data berdasarkan current temp
      if (currentTemp !== null) {
        const dailyFallback = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          const baseTemp = currentTemp;
          const variation = (Math.random() - 0.5) * 6; // ±3°C variation
          const avgTemp = Math.max(0, baseTemp + variation);

          dailyFallback.push({
            date: date.toLocaleDateString(),
            avgTemp: Math.round(avgTemp * 100) / 100,
            minTemp: Math.round((avgTemp - 2) * 100) / 100,
            maxTemp: Math.round((avgTemp + 2) * 100) / 100,
          });
        }

        setDailyData(dailyFallback);
        console.log("✅ Daily fallback data generated");
      }
    } catch (err) {
      console.error("❌ Error fetching daily data:", err);

      // Generate dummy daily data
      const dummyDaily = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const temp = 25 + Math.random() * 10;

        dummyDaily.push({
          date: date.toLocaleDateString(),
          avgTemp: Math.round(temp * 100) / 100,
          minTemp: Math.round((temp - 2) * 100) / 100,
          maxTemp: Math.round((temp + 2) * 100) / 100,
        });
      }

      setDailyData(dummyDaily);
    }
  };

  // PERBAIKAN: Generate fallback data jika semua endpoint gagal
  const generateFallbackData = async () => {
    console.log("⚠️ Generating fallback chart data...");

    const now = new Date();
    const fallbackData = [];

    for (let i = 9; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000);
      const temp = 25 + Math.random() * 10; // Random temperature 25-35°C

      fallbackData.push({
        time: time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        temperature: Math.round(temp * 100) / 100,
        minTemp: Math.round((temp - 1) * 100) / 100,
        maxTemp: Math.round((temp + 1) * 100) / 100,
        sampleCount: 1,
        tempRange: 2,
      });
    }

    setChartData(fallbackData);
    setCurrentTemp(fallbackData[fallbackData.length - 1].temperature);
    setIsConnected(false);
    setError("Using fallback data - check server connection");
    setLastUpdate(new Date());

    console.log("✅ Fallback data generated");
  };

  // === useEffect untuk fetch data awal ===
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await fetchTodayAggregateData();
      await fetchDailyData();
      setLoading(false);
    };

    fetchAllData();
  }, []);

  // === useEffect untuk auto refresh ===
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      console.log("🔄 Refreshing chart data...");
      fetchTodayAggregateData();
      fetchDailyData();
    }, 30000); // Refresh setiap 30 detik

    return () => clearInterval(interval);
  }, [loading]);

  // === Custom tooltip untuk charts ===
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded shadow-lg">
          <p className="font-medium">{`Time: ${label}`}</p>
          <p className="text-blue-600">{`Temperature: ${payload[0].value}°C`}</p>
          {payload[0].payload.sampleCount && (
            <p className="text-gray-500 text-sm">{`Samples: ${payload[0].payload.sampleCount}`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded shadow-lg">
          <p className="font-medium">{`Date: ${label}`}</p>
          <p className="text-green-600">{`Avg: ${payload[0].value}°C`}</p>
          <p className="text-blue-600">{`Min: ${payload[1].value}°C`}</p>
          <p className="text-red-600">{`Max: ${payload[2].value}°C`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading state */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status dan Current Temperature */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Real-time Temperature
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isConnected ? "🟢 ESP32 Connected" : "⚠️ Using Simulation"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {currentTemp ? `${currentTemp}°C` : "--"}
            </div>
            {lastUpdate && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        {error && <p className="text-orange-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Line Chart - Temperature Over Time (10 menit interval) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Temperature Trend (Last 10 readings)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart - Daily Temperature Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Daily Temperature Summary (Last 7 days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip content={<CustomBarTooltip />} />
            <Legend />
            <Bar dataKey="avgTemp" fill="#10B981" name="Average" />
            <Bar dataKey="minTemp" fill="#3B82F6" name="Minimum" />
            <Bar dataKey="maxTemp" fill="#EF4444" name="Maximum" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Area Chart - Temperature Range */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Temperature Range Analysis
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
