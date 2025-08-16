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
  const [chartData, setChartData] = useState([
    { time: "08:00", dryer1: 120, dryer2: 100, dryer3: 90 },
    { time: "09:00", dryer1: 135, dryer2: 110, dryer3: 95 },
    { time: "10:00", dryer1: 140, dryer2: 115, dryer3: 100 },
    { time: "11:00", dryer1: 150, dryer2: 120, dryer3: 105 },
    { time: "12:00", dryer1: 160, dryer2: 125, dryer3: 110 },
    { time: "13:00", dryer1: 155, dryer2: 130, dryer3: 120 },
    { time: "14:00", dryer1: 165, dryer2: 135, dryer3: 125 },
  ]);

  const [currentTemp, setCurrentTemp] = useState(null);

  // Fungsi untuk mendapatkan waktu saat ini dalam format HH:MM
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/suhu");
        const data = await response.json();
        const newTemp = parseFloat(data.suhu);

        if (!isNaN(newTemp)) {
          setCurrentTemp(newTemp);

          // Update chart data dengan data real-time
          setChartData((prevData) => {
            const newData = [...prevData];
            const currentTime = getCurrentTime();

            // Cari apakah waktu saat ini sudah ada di data
            const existingIndex = newData.findIndex(
              (item) => item.time === currentTime
            );

            if (existingIndex >= 0) {
              // Update data yang sudah ada
              newData[existingIndex] = {
                ...newData[existingIndex],
                dryer1: newTemp,
              };
            } else {
              // Tambah data baru dan jaga maksimal 10 data points
              const newEntry = {
                time: currentTime,
                dryer1: newTemp,
                dryer2: prevData[prevData.length - 1]?.dryer2 || 100, // Pertahankan nilai sebelumnya
                dryer3: prevData[prevData.length - 1]?.dryer3 || 90, // Pertahankan nilai sebelumnya
              };

              newData.push(newEntry);

              // Jaga maksimal 10 data points
              if (newData.length > 10) {
                newData.shift();
              }
            }

            return newData;
          });
        }
      } catch (err) {
        console.error("Gagal ambil data:", err);
      }
    };

    // Fetch initial data
    fetchData();

    // Update setiap 5 detik (sesuaikan dengan kebutuhan)
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Line Chart */}
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
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [`${value}°C`, name]}
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
              <Line
                type="monotone"
                dataKey="dryer2"
                stroke="#93c5fd"
                strokeWidth={2}
                name="Dryer 2"
              />
              <Line
                type="monotone"
                dataKey="dryer3"
                stroke="#86efac"
                strokeWidth={2}
                name="Dryer 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Bar Chart - Suhu Dryer
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Live Data
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [`${value}°C`, name]}
                labelFormatter={(label) => `Waktu: ${label}`}
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
        </div>
      </div>
    </>
  );
}
