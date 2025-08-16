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
  const data = [
    { time: "08:00", dryer1: 120, dryer2: 100, dryer3: 90 },
    { time: "09:00", dryer1: 135, dryer2: 110, dryer3: 95 },
    { time: "10:00", dryer1: 140, dryer2: 115, dryer3: 100 },
    { time: "11:00", dryer1: 150, dryer2: 120, dryer3: 105 },
    { time: "12:00", dryer1: 160, dryer2: 125, dryer3: 110 },
    { time: "13:00", dryer1: 155, dryer2: 130, dryer3: 120 },
    { time: "14:00", dryer1: 165, dryer2: 135, dryer3: 125 },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Line Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Line Chart - Suhu Dryer
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="dryer1"
                stroke="#fca5a5"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="dryer2"
                stroke="#93c5fd"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="dryer3"
                stroke="#86efac"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Bar Chart - Suhu Dryer
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="dryer1"
                fill="#fca5a5"
                activeBar={{ fill: "#f87171", radius: [6, 6, 0, 0] }} // rose-400 (lebih tajam)
                radius={2}
              />
              <Bar
                dataKey="dryer2"
                fill="#93c5fd"
                activeBar={{ fill: "#60a5fa", radius: [6, 6, 0, 0] }} // sky-400
                radius={2}
              />
              <Bar
                dataKey="dryer3"
                fill="#86efac"
                activeBar={{ fill: "#34d399", radius: [6, 6, 0, 0] }} // emerald-400
                radius={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
