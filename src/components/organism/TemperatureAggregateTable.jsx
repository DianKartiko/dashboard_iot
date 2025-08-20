import React, { useState } from "react";
import {
  Calendar,
  Clock,
  TrendingUp,
  Database,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ButtonData from "../atoms/ButtonData";
import Badge from "../atoms/Badge";
import TableHeader from "../molecules/TableHeader";

const TemperatureAggregateTable = ({
  data = [],
  onExport,
  isLoading,
  systemStatus,
}) => {
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    return [...data].sort((a, b) => {
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
  }, [data, sortField, sortDirection]);

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
    if (!temp) return { variant: "default", text: "Unknown" };
    if (temp < 20) return { variant: "info", text: "Cold" };
    if (temp < 30) return { variant: "success", text: "Normal" };
    if (temp < 40) return { variant: "warning", text: "Warm" };
    return { variant: "danger", text: "Hot" };
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <TableHeader
          title="Temperature Aggregate Data"
          subtitle="Loading data from Prisma database..."
        />
        <div className="p-6 sm:p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Fetching aggregated data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <TableHeader
        title="Temperature Log"
        subtitle={`${data.length} agregasi records • Data interval 10 menit dari Prisma DB`}
        actions={[
          <div
            key="status"
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
          >
            {systemStatus?.aggregatesReady > 0 && (
              <Badge variant="warning">
                <span className="hidden sm:inline">
                  {systemStatus.aggregatesReady}{" "}
                </span>
                Ready for Export
              </Badge>
            )}
            <Badge variant={data.length > 0 ? "success" : "default"}>
              {data.length > 0 ? "Data Available" : "No Data"}
            </Badge>
          </div>,
        ]}
      />

      {/* Empty State */}
      {sortedData.length === 0 && !isLoading && (
        <div className="p-8 text-center">
          <Database className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Data Available
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No temperature aggregate data found for today.
          </p>
        </div>
      )}

      {/* Mobile Card View */}
      {sortedData.length > 0 && (
        <div className="block lg:hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((record, index) => {
              const status = getTemperatureStatus(record.meanTemp);
              const tempRange = record.maxTemp - record.minTemp;

              return (
                <div
                  key={record.id || index}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(record.date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {record.timeSlot}
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Mean Temp
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-mono">
                        {record.meanTemp ? record.meanTemp.toFixed(1) : "N/A"}°C
                      </div>
                      {record.medianTemp && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Median: {record.medianTemp.toFixed(1)}°C
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Range
                      </div>
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                        {record.minTemp ? record.minTemp.toFixed(1) : "N/A"}°C -{" "}
                        {record.maxTemp ? record.maxTemp.toFixed(1) : "N/A"}°C
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Span: {tempRange ? tempRange.toFixed(1) : "N/A"}°C
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Database className="w-3 h-3 mr-1" />
                      {record.sampleCount || 0} samples
                    </div>
                    <div className="flex items-center">
                      {record.isExported ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span className="text-xs">Exported</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          <span className="text-xs">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      {sortedData.length > 0 && (
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <Calendar className="w-4 h-4" />
                    {sortField === "date" && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort("timeSlot")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Time Slot</span>
                    <Clock className="w-4 h-4" />
                    {sortField === "timeSlot" && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort("meanTemp")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Mean Temp</span>
                    <TrendingUp className="w-4 h-4" />
                    {sortField === "meanTemp" && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Samples
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Export Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.map((record, index) => {
                const status = getTemperatureStatus(record.meanTemp);
                const tempRange =
                  record.maxTemp && record.minTemp
                    ? record.maxTemp - record.minTemp
                    : 0;

                return (
                  <tr
                    key={record.id || index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <span className="font-mono font-medium">
                        {record.timeSlot || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex flex-col">
                        <span className="font-mono text-lg font-semibold">
                          {record.meanTemp ? record.meanTemp.toFixed(1) : "N/A"}
                          °C
                        </span>
                        {record.medianTemp && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Median: {record.medianTemp.toFixed(1)}°C
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span className="font-mono">
                          {record.minTemp ? record.minTemp.toFixed(1) : "N/A"}°C
                          - {record.maxTemp ? record.maxTemp.toFixed(1) : "N/A"}
                          °C
                        </span>
                        <span className="text-xs">
                          Range: {tempRange ? tempRange.toFixed(1) : "N/A"}°C
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Database className="w-4 h-4 mr-1" />
                        {record.sampleCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={status.variant}>{status.text}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {record.isExported ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-xs">Exported</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-yellow-600 dark:text-yellow-400">
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-3 py-3 sm:px-6 sm:py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, sortedData.length)} of{" "}
              {sortedData.length} results
            </div>
            <div className="flex items-center space-x-1 order-1 sm:order-2">
              <ButtonData
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                icon={ChevronLeft}
                className="px-2 py-1"
              >
                <span className="hidden sm:inline">Previous</span>
              </ButtonData>

              {/* Page numbers - responsive */}
              <div className="hidden sm:flex space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <ButtonData
                      key={page}
                      variant={currentPage === page ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="px-3 py-1"
                    >
                      {page}
                    </ButtonData>
                  );
                })}
              </div>

              {/* Mobile page indicator */}
              <div className="sm:hidden px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                {currentPage} / {totalPages}
              </div>

              <ButtonData
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                icon={ChevronRight}
                className="px-2 py-1"
              >
                <span className="hidden sm:inline">Next</span>
              </ButtonData>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemperatureAggregateTable;
