import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Subtitle from "../atoms/Subtitle";
export default function Dryers() {
  const { token } = useAuth();

  const [dryersData, setDryersData] = useState({
    dryer1: 0,
    dryer2: 0,
    dryer3: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchDryersData = async () => {
    try {
      setError(null);

      if (token) {
        try {
          // PERBAIKAN: Gunakan endpoint yang benar /api/sensor/suhu
          const response = await fetch(
            "http://localhost:3000/api/sensor/suhu",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const result = await response.json();
            console.log("✅ Sensor suhu data:", result);

            if (result.success && result.suhu !== undefined) {
              // PERBAIKAN: Gunakan data suhu dari response
              const currentTemp = parseFloat(result.suhu);

              setDryersData({
                dryer1: currentTemp,
                dryer2: Math.max(0, currentTemp + (Math.random() - 0.5) * 4),
                dryer3: Math.max(0, currentTemp + (Math.random() - 0.5) * 4),
              });

              setIsConnected(!result.usingSimulation);
              setLastUpdate(new Date());
              setLoading(false);

              if (result.usingSimulation) {
                setError("Using simulation data - check ESP32 connection");
              }

              console.log("✅ Dryers data updated from sensor/suhu endpoint");
              return;
            }
          } else if (response.status === 401 || response.status === 403) {
            console.warn(
              "⚠️ Sensor/suhu endpoint unauthorized, trying current"
            );
          }
        } catch (suhuError) {
          console.warn("⚠️ Sensor/suhu endpoint failed:", suhuError.message);
        }

        // PERBAIKAN: Fallback ke /api/sensor/current
        try {
          const response = await fetch(
            "http://localhost:3000/api/sensor/current",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const result = await response.json();
            console.log("✅ Sensor current data:", result);

            if (result.success && result.data) {
              // Process data dari /current endpoint
              const latestData = result.data[1]; // Ambil data dryer pertama
              if (latestData) {
                setDryersData({
                  dryer1: latestData.suhu || 0,
                  dryer2: Math.max(
                    0,
                    (latestData.suhu || 0) + (Math.random() - 0.5) * 4
                  ),
                  dryer3: Math.max(
                    0,
                    (latestData.suhu || 0) + (Math.random() - 0.5) * 4
                  ),
                });
                setIsConnected(!result.usingSimulation);
                setLastUpdate(new Date());
                setLoading(false);
                console.log(
                  "✅ Dryers data updated from sensor/current endpoint"
                );
                return;
              }
            }
          }
        } catch (currentError) {
          console.warn(
            "⚠️ Sensor/current endpoint failed:",
            currentError.message
          );
        }
      }

      // PERBAIKAN: HAPUS fallback ke /api/suhu karena sudah dipindah ke /api/sensor/suhu
      throw new Error("All sensor endpoints failed");
    } catch (err) {
      console.error("❌ Error fetching dryers data:", err);
      setError(`Failed to fetch data: ${err.message}`);
      setIsConnected(false);

      // Generate dummy data jika semua endpoint gagal
      setDryersData({
        dryer1: 25 + Math.random() * 10,
        dryer2: 25 + Math.random() * 10,
        dryer3: 25 + Math.random() * 10,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token !== undefined) {
      fetchDryersData();
    }
  }, [token]);

  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      console.log("🔄 Refreshing dryers data...");
      fetchDryersData();
    }, 5000); // PERBAIKAN: Ubah ke 5 detik untuk mengurangi load

    return () => clearInterval(interval);
  }, [token, loading]);

  const stats = [
    {
      title: "Oli Dryer 1",
      count: Math.round(dryersData.dryer1 * 100) / 100,
      icon: (
        <svg
          className="w-6 h-6 text-amber-500"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8.597 3.2A1 1 0 0 0 7.04 4.289a3.49 3.49 0 0 1 .057 1.795 3.448 3.448 0 0 1-.84 1.575.999.999 0 0 0-.077.094c-.596.817-3.96 5.6-.941 10.762l.03.049a7.73 7.73 0 0 0 2.917 2.602 7.617 7.617 0 0 0 3.772.829 8.06 8.06 0 0 0 3.986-.975 8.185 8.185 0 0 0 3.04-2.864c1.01-2.2 1.184-4.556.588-6.441-.583-1.848-1.68-3.414-2.607-4.102a1 1 0 0 0-1.594.757c-.067 1.431-.363 2.551-.794 3.431-.222-2.407-1.127-4.196-2.224-5.524-1.147-1.39-2.564-2.3-3.323-2.788a8.487 8.487 0 0 1-.432-.287Z" />
        </svg>
      ),
      bg: "bg-amber-200",
      iconBg: "bg-amber-300 text-amber-600",
    },
    {
      title: "Oli Dryer 2",
      count: 0,
      icon: (
        <svg
          className="w-6 h-6 text-pink-500"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8.597 3.2A1 1 0 0 0 7.04 4.289a3.49 3.49 0 0 1 .057 1.795 3.448 3.448 0 0 1-.84 1.575.999.999 0 0 0-.077.094c-.596.817-3.96 5.6-.941 10.762l.03.049a7.73 7.73 0 0 0 2.917 2.602 7.617 7.617 0 0 0 3.772.829 8.06 8.06 0 0 0 3.986-.975 8.185 8.185 0 0 0 3.04-2.864c1.301-2.2 1.184-4.556.588-6.441-.583-1.848-1.68-3.414-2.607-4.102a1 1 0 0 0-1.594.757c-.067 1.431-.363 2.551-.794 3.431-.222-2.407-1.127-4.196-2.224-5.524-1.147-1.39-2.564-2.3-3.323-2.788a8.487 8.487 0 0 1-.432-.287Z" />
        </svg>
      ),
      bg: "bg-pink-200",
      iconBg: "bg-pink-300 text-pink-600", // PERBAIKAN: Fix color
    },
    {
      title: "Oli Dryer 3",
      count: 0,
      icon: (
        <svg
          className="w-6 h-6 text-sky-500"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8.597 3.2A1 1 0 0 0 7.04 4.289a3.49 3.49 0 0 1 .057 1.795 3.448 3.448 0 0 1-.84 1.575.999.999 0 0 0-.077.094c-.596.817-3.96 5.6-.941 10.762l.03.049a7.73 7.73 0 0 0 2.917 2.602 7.617 7.617 0 0 0 3.772.829 8.06 8.06 0 0 0 3.986-.975 8.185 8.185 0 0 0 3.04-2.864c1.301-2.2 1.184-4.556.588-6.441-.583-1.848-1.68-3.414-2.607-4.102a1 1 0 0 0-1.594.757c-.067 1.431-.363 2.551-.794 3.431-.222-2.407-1.127-4.196-2.224-5.524-1.147-1.39-2.564-2.3-3.323-2.788a8.487 8.487 0 0 1-.432-.287Z" />
        </svg>
      ),
      bg: "bg-sky-200",
      iconBg: "bg-sky-300 text-sky-600", // PERBAIKAN: Fix color
    },
  ];

  if (loading) {
    return (
      <div className="bg-grey-50 dark:bg-gray-800 rounded-lg p-4 my-4 w-full">
        <Subtitle title="Summary" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-100 dark:bg-gray-700 rounded-lg shadow p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-grey-50 dark:bg-gray-800 rounded-lg p-4 my-4 w-full">
      <Subtitle title="Summary" />
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-lg shadow p-4 flex flex-col justify-between ${item.bg}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${item.iconBg}`}
              >
                <span className="text-lg">{item.icon}</span>
              </div>
              <span className="font-medium text-lg">{item.title}</span>
            </div>
            <div className="mt-4 flex justify-between items-end">
              <span className="text-sm text-gray-500 dark:text-gray-700">
                Temperatures
              </span>
              <span className="text-lg font-bold">
                {item.count} <span className="text-sm font-medium">°C</span>
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* PERBAIKAN: Status indicator */}
      {lastUpdate && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {isConnected ? "🟢 ESP32 Connected" : "⚠️ Using Simulation"} • Last
          update: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
