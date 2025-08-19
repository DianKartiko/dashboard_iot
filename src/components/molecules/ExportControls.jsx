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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900">Export Data</h4>
            {autoExportStatus && (
              <Badge
                variant={
                  autoExportStatus === "scheduled" ? "warning" : "success"
                }
              >
                Auto Export{" "}
                {autoExportStatus === "scheduled" ? "Scheduled" : "Active"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {recordCount} agregasi records tersedia untuk export
          </p>
          {lastExport && (
            <p className="text-xs text-gray-400">
              Last export: {new Date(lastExport).toLocaleString("id-ID")}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <ButtonData
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            disabled={isExporting || recordCount === 0}
            icon={Download}
          >
            Export CSV
          </ButtonData>
          <ButtonData
            variant="success"
            size="sm"
            onClick={onExportExcel}
            disabled={isExporting || recordCount === 0}
            icon={Download}
          >
            Export Excel
          </ButtonData>
        </div>
      </div>
      {isExporting && (
        <div className="mt-2">
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Exporting data from Prisma database...
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportControls;