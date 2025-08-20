import { Download } from "lucide-react";
import ButtonData from "../atoms/ButtonData";
import Badge from "../atoms/Badge";

const ExportControls = ({
  onExportCSV,
  onExportExcel,
  isExporting,
  recordCount,
  lastExport,
  autoExportStatus,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
              Export Data
            </h4>
            {autoExportStatus && (
              <Badge
                variant={
                  autoExportStatus === "scheduled" ? "warning" : "success"
                }
              >
                <span className="hidden sm:inline">Auto Export </span>
                {autoExportStatus === "scheduled" ? "Scheduled" : "Active"}
              </Badge>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span className="font-medium">{recordCount}</span> agregasi records
            tersedia untuk export
          </p>

          {lastExport && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Last export: {new Date(lastExport).toLocaleString("id-ID")}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <ButtonData
            variant="outline"
            size="md"
            onClick={onExportCSV}
            disabled={isExporting || recordCount === 0}
            icon={Download}
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Export </span>CSV
          </ButtonData>
          <ButtonData
            variant="success"
            size="md"
            onClick={onExportExcel}
            disabled={isExporting || recordCount === 0}
            icon={Download}
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Export </span>Excel
          </ButtonData>
        </div>
      </div>

      {isExporting && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center text-xs sm:text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
            <span>Exporting data from Prisma database...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportControls;
