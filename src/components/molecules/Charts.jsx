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

  // === fetchTodayAggregateData (LineChart, 10 menit interval) ===
  const fetchTodayAggregateData = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/aggregate/today");
      const result = await response.json();

      if (
        response.ok &&
        result.success &&
        result.data &&
        Array.isArray(result.data.aggregates) &&
        result.data.aggregates.length > 0
      ) {
        // Format langsung dari database aggregate
        const formattedData = result.data.aggregates.map((item) => ({
          time: item.timeSlot, // contoh: "10:00", "10:10"
          dryer1: parseFloat(item.meanTemp), // ambil hanya Dryer 1 (asli dari DB)
        }));

        setChartData(formattedData);
      } else {
        console.warn(
          "⚠️ Tidak ada data aggregate hari ini, fallback ke simulasi..."
        );
        await generateSimulatedLineData();
      }
    } catch (err) {
      console.error("❌ Error fetch aggregate today:", err);
      await generateSimulatedLineData();
    }
  };

  // Generate data simulasi untuk LineChart jika tidak ada data agregasi
  const generateSimulatedLineData = async () => {
    try {
      console.log("Generating simulated line data...");
      const baseTemp = currentTemp || 25;
      const now = new Date();
      const simulatedData = [];

      for (let i = 9; i >= 0; i--) {
        const slotTime = new Date(now.getTime() - i * 10 * 60 * 1000); // mundur 10 menit
        const hour = slotTime.getHours().toString().padStart(2, "0");
        const minute = (Math.floor(slotTime.getMinutes() / 10) * 10)
          .toString()
          .padStart(2, "0");
        const timeSlot = `${hour}:${minute}`;

        // ±2°C dari base
        const tempVariation = (Math.random() - 0.5) * 4;
        const dryer1Temp = Math.max(0, baseTemp + tempVariation);

        simulatedData.push({
          time: timeSlot,
          dryer1: Math.round(dryer1Temp * 10) / 10,
        });
      }

      console.log("✅ Simulated data:", simulatedData);
      setChartData(simulatedData);
    } catch (err) {
      console.error("Error generating simulated data:", err);
    }
  };

  // Fetch current temperature
  const fetchCurrentTemperature = async () => {
    try {
      console.log("Fetching current temperature...");

      // Gunakan endpoint yang sudah pasti ada dari server.mjs
      const response = await fetch("http://localhost:5000/api/suhu");
      const data = await response.json();
      console.log("Temperature response:", data);

      const newTemp = parseFloat(data.suhu);

      if (!isNaN(newTemp)) {
        setCurrentTemp(newTemp);
        console.log("Current temp set to:", newTemp);
      }
    } catch (err) {
      console.error("Error fetching current temperature:", err);
      // Set default temp jika gagal
      setCurrentTemp(25);
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

        const response = await fetch(
          `http://localhost:5000/api/sensor/history/${dateString}`
        );
        const result = await response.json();

        let avgTemp = 0;
        const dayLabel = targetDate.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "2-digit",
        });

        if (result.success && result.data) {
          if (result.data.source === "backup" && result.data.backup) {
            avgTemp = result.data.backup.avgDailyTemp;
          } else if (
            result.data.source === "aggregate" &&
            result.data.aggregates
          ) {
            const temps = result.data.aggregates.map((item) => item.meanTemp);
            avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
            avgTemp = Math.round(avgTemp * 100) / 100;
          }
        }

        // Fallback → kalau hari ini kosong, pakai suhu terakhir
        if (avgTemp === 0 && i === 0 && currentTemp > 0) {
          avgTemp = currentTemp;
        }

        dailyAverages.push({
          time: dayLabel,
          dryer1: avgTemp || 0, // hanya Dryer 1
        });
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
      try {
        // Fetch current temp first
        await fetchCurrentTemperature();

        // Wait a bit for currentTemp to be set
        setTimeout(async () => {
          await Promise.all([fetchTodayAggregateData(), fetchHistoricalData()]);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError("Gagal memuat data");
        console.error("Error in initial fetch:", err);
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Update current temperature dan LineChart setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrentTemperature();
      fetchTodayAggregateData();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Update BarChart setiap 5 menit
  useEffect(() => {
    const dailyInterval = setInterval(() => {
      fetchHistoricalData();
    }, 300000); // 5 menit

    return () => clearInterval(dailyInterval);
  }, [currentTemp]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Line Chart - Data per 10 menit */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Line Chart - Suhu Dryer
            </h2>
            {currentTemp && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Current: {currentTemp}°C
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              {/* XAxis disembunyikan sesuai permintaan */}
              <XAxis
                dataKey="time"
                tick={false}
                axisLine={false}
                tickLine={false}
                height={0}
              />
              <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip
                formatter={(value, name) => [
                  `${Math.round(value * 10) / 10}°C`,
                  name,
                ]}
                labelFormatter={(label) => `Waktu: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="dryer1"
                stroke="#fca5a5"
                strokeWidth={3}
                activeDot={{ r: 6, fill: "#f87171" }}
                dot={{ r: 4 }}
                name="Dryer 1 (Real-time)"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Data per 10 menit hari ini • {chartData.length} data points •
            {chartData.length > 0 &&
              ` Range: ${Math.min(
                ...chartData.map((d) => Math.min(d.dryer1, d.dryer2, d.dryer3))
              )}°C - ${Math.max(
                ...chartData.map((d) => Math.max(d.dryer1, d.dryer2, d.dryer3))
              )}°C`}
          </div>
        </div>

        {/* Bar Chart - Rata-rata harian */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Bar Chart - Suhu Dryer
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Rata-rata Harian
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              {/* XLabel minimal - hanya label hari */}
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={0} />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  `${Math.round(value * 10) / 10}°C`,
                  name,
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              <Bar
                dataKey="dryer1"
                fill="#fca5a5"
                activeBar={{ fill: "#f87171", radius: [6, 6, 0, 0] }}
                radius={2}
                name="Dryer 1 (Real-time)"
              />
              <Bar
                dataKey="dryer2"
                fill="#93c5fd"
                activeBar={{ fill: "#60a5fa", radius: [6, 6, 0, 0] }}
                radius={2}
                name="Dryer 2"
              />
              <Bar
                dataKey="dryer3"
                fill="#86efac"
                activeBar={{ fill: "#34d399", radius: [6, 6, 0, 0] }}
                radius={2}
                name="Dryer 3"
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            7 hari terakhir • Update setiap 5 menit
          </div>
        </div>
      </div>
    </>
  );
}
