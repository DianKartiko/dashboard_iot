import React from "react";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import ButtonData from "../atoms/ButtonData";

const TemperatureAggregateTable = ({
  data,
  onExport,
  isLoading,
  systemStatus,
}) => {
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (sortField === "date") {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
    }
    if (sortField === "meanTemp") {
      return sortDirection === "asc"
        ? a.meanTemp - b.meanTemp
        : b.meanTemp - a.meanTemp;
    }
    if (sortField === "timeSlot") {
      return sortDirection === "asc"
        ? a.timeSlot.localeCompare(b.timeSlot)
        : b.timeSlot.localeCompare(a.timeSlot);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getTemperatureStatus = (temp) => {
    if (temp < 20) return { variant: "info", text: "Cold" };
    if (temp < 30) return { variant: "success", text: "Normal" };
    if (temp < 40) return { variant: "warning", text: "Warm" };
    return { variant: "danger", text: "Hot" };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <TableHeader
          title="Temperature Aggregate Data"
          subtitle="Loading data from Prisma database..."
        />
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">
            Fetching aggregated data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <TableHeader
        title="Temperature Log"
        subtitle={`${data.length} agregasi records • Data interval 10 menit dari Prisma DB`}
        actions={[
          <div key="status" className="flex items-center gap-2">
            {systemStatus?.aggregatesReady > 0 && (
              <Badge variant="warning">
                {systemStatus.aggregatesReady} Ready for Export
              </Badge>
            )}
            <Badge variant={data.length > 0 ? "success" : "default"}>
              {data.length > 0 ? "Data Available" : "No Data"}
            </Badge>
          </div>,
        ]}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <Calendar className="w-4 h-4" />
                  {sortField === "date" && (
                    <span className="text-blue-600">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("timeSlot")}
              >
                <div className="flex items-center space-x-1">
                  <span>Time Slot</span>
                  <Clock className="w-4 h-4" />
                  {sortField === "timeSlot" && (
                    <span className="text-blue-600">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("meanTemp")}
              >
                <div className="flex items-center space-x-1">
                  <span>Mean Temp</span>
                  <TrendingUp className="w-4 h-4" />
                  {sortField === "meanTemp" && (
                    <span className="text-blue-600">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Samples
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Export Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((record, index) => {
              const status = getTemperatureStatus(record.meanTemp);
              const tempRange = record.maxTemp - record.minTemp;

              return (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Date(record.date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono font-medium">
                      {record.timeSlot}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-mono text-lg font-semibold">
                        {record.meanTemp.toFixed(1)}°C
                      </span>
                      <span className="text-xs text-gray-500">
                        Median: {record.medianTemp.toFixed(1)}°C
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span className="font-mono">
                        {record.minTemp.toFixed(1)}°C -{" "}
                        {record.maxTemp.toFixed(1)}°C
                      </span>
                      <span className="text-xs">
                        Range: {tempRange.toFixed(1)}°C
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 mr-1" />
                      {record.sampleCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {record.isExported ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs">Exported</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          <span className="text-xs">Pending</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, sortedData.length)} of{" "}
              {sortedData.length} results
            </div>
            <div className="flex space-x-1">
              <ButtonData
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </ButtonData>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <ButtonData
                    key={page}
                    variant={currentPage === page ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </ButtonData>
                );
              })}
              <ButtonData
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </ButtonData>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemperatureAggregateTable;
