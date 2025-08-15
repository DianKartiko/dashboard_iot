import Subtitle from "../atoms/Subtitle";

export default function Dryers() {
  const stats = [
    {
      title: "Oli Dryer 1",
      count: 30,
      icon: (
        <svg
          class="w-6 h-6 text-gray-800 dark:text-amber-400"
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
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Oli Dryer 2",
      count: 30,
      icon: (
        <svg
          class="w-6 h-6 text-gray-800 dark:text-pink-500"
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
      bg: "bg-red-50",
      iconBg: "bg-red-100 text-red-600",
    },
    {
      title: "Oli Dryer 3",
      count: 30,
      icon: (
        <svg
          class="w-6 h-6 text-gray-800 dark:text-sky-500"
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
      bg: "bg-sky-50",
      iconBg: "bg-sky-100 text-sky-600",
    },
  ];

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm shadow-slate-300 my-4 w-full">
      <Subtitle title="Summary" />
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
              <span className="text-sm text-gray-500">Temperatures</span>
              <span className="text-lg font-bold">
                {item.count} <span className="text-sm font-medium">°C</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
