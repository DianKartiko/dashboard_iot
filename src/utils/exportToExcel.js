import * as XLSX from "xlsx";

// PERBAIKAN: Comprehensive export utilities
export class ExportUtils {
  // PERBAIKAN: Export to Excel with multiple sheets
  static exportToExcel(data, filename = "export", options = {}) {
    try {
      const {
        sheetName = "Sheet1",
        multipleSheets = false,
        includeTimestamp = true,
        customHeaders = null,
        formatters = {},
      } = options;

      const workbook = XLSX.utils.book_new();

      if (multipleSheets && Array.isArray(data)) {
        // Multiple sheets export
        data.forEach((sheetData, index) => {
          const sheetName = sheetData.name || `Sheet${index + 1}`;
          const worksheet = this.createWorksheet(sheetData.data, {
            customHeaders: sheetData.headers || customHeaders,
            formatters: sheetData.formatters || formatters,
          });
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });
      } else {
        // Single sheet export
        const worksheet = this.createWorksheet(data, {
          customHeaders,
          formatters,
        });
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      // Generate filename with timestamp
      const finalFilename = includeTimestamp
        ? `${filename}_${new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/:/g, "-")}.xlsx`
        : `${filename}.xlsx`;

      // Write and download file
      XLSX.writeFile(workbook, finalFilename);

      console.log(`Excel file exported: ${finalFilename}`);
      return { success: true, filename: finalFilename };
    } catch (error) {
      console.error("Excel export failed:", error);
      throw new Error(`Excel export failed: ${error.message}`);
    }
  }

  // PERBAIKAN: Create worksheet with formatting
  static createWorksheet(data, options = {}) {
    const { customHeaders, formatters = {} } = options;

    if (!data || data.length === 0) {
      return XLSX.utils.aoa_to_sheet([["No data available"]]);
    }

    // Process data with formatters
    const processedData = data.map((row) => {
      const processedRow = { ...row };

      Object.keys(formatters).forEach((key) => {
        if (processedRow[key] !== undefined) {
          processedRow[key] = formatters[key](processedRow[key]);
        }
      });

      return processedRow;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(processedData, {
      header: customHeaders || Object.keys(data[0] || {}),
    });

    // Auto-size columns
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    const colWidths = [];

    for (let col = range.s.c; col <= range.e.c; col++) {
      let maxWidth = 10; // minimum width

      for (let row = range.s.r; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];

        if (cell && cell.v) {
          const cellLength = cell.v.toString().length;
          maxWidth = Math.max(maxWidth, cellLength);
        }
      }

      colWidths.push({ width: Math.min(maxWidth + 2, 50) }); // max width 50
    }

    worksheet["!cols"] = colWidths;

    return worksheet;
  }

  // PERBAIKAN: Export to CSV
  static exportToCSV(data, filename = "export", options = {}) {
    try {
      const {
        includeTimestamp = true,
        customHeaders = null,
        delimiter = ",",
        formatters = {},
      } = options;

      if (!data || data.length === 0) {
        throw new Error("No data to export");
      }

      // Process data with formatters
      const processedData = data.map((row) => {
        const processedRow = { ...row };

        Object.keys(formatters).forEach((key) => {
          if (processedRow[key] !== undefined) {
            processedRow[key] = formatters[key](processedRow[key]);
          }
        });

        return processedRow;
      });

      // Get headers
      const headers = customHeaders || Object.keys(processedData[0]);

      // Create CSV content
      const csvContent = [
        headers.join(delimiter),
        ...processedData.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || "";
              // Escape values containing delimiter or quotes
              return typeof value === "string" &&
                (value.includes(delimiter) || value.includes('"'))
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            })
            .join(delimiter)
        ),
      ].join("\n");

      // Generate filename
      const finalFilename = includeTimestamp
        ? `${filename}_${new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/:/g, "-")}.csv`
        : `${filename}.csv`;

      // Download file
      this.downloadFile(csvContent, finalFilename, "text/csv");

      console.log(`CSV file exported: ${finalFilename}`);
      return { success: true, filename: finalFilename };
    } catch (error) {
      console.error("CSV export failed:", error);
      throw new Error(`CSV export failed: ${error.message}`);
    }
  }

  // PERBAIKAN: Download file helper
  static downloadFile(
    content,
    filename,
    mimeType = "application/octet-stream"
  ) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    window.URL.revokeObjectURL(url);
  }

  // PERBAIKAN: Temperature data specific export
  static exportTemperatureData(data, type = "excel", options = {}) {
    const formatters = {
      timestamp: (value) => new Date(value).toLocaleString(),
      temperature: (value) => `${parseFloat(value).toFixed(2)}°C`,
      createdAt: (value) => new Date(value).toLocaleString(),
      ...options.formatters,
    };

    const customHeaders = [
      "timestamp",
      "temperature",
      "humidity",
      "status",
      "createdAt",
    ];

    const exportOptions = {
      includeTimestamp: true,
      customHeaders,
      formatters,
      ...options,
    };

    if (type === "csv") {
      return this.exportToCSV(data, "temperature_data", exportOptions);
    } else {
      return this.exportToExcel(data, "temperature_data", exportOptions);
    }
  }

  // PERBAIKAN: Aggregate data export
  static exportAggregateData(data, type = "excel", options = {}) {
    const formatters = {
      date: (value) => new Date(value).toLocaleDateString(),
      avgTemp: (value) => `${parseFloat(value).toFixed(2)}°C`,
      minTemp: (value) => `${parseFloat(value).toFixed(2)}°C`,
      maxTemp: (value) => `${parseFloat(value).toFixed(2)}°C`,
      totalReadings: (value) => parseInt(value).toLocaleString(),
      ...options.formatters,
    };

    const customHeaders = [
      "date",
      "avgTemp",
      "minTemp",
      "maxTemp",
      "totalReadings",
      "status",
    ];

    const exportOptions = {
      includeTimestamp: true,
      customHeaders,
      formatters,
      sheetName: "Temperature Aggregate",
      ...options,
    };

    if (type === "csv") {
      return this.exportToCSV(data, "temperature_aggregate", exportOptions);
    } else {
      return this.exportToExcel(data, "temperature_aggregate", exportOptions);
    }
  }

  // PERBAIKAN: System report export (multiple sheets)
  static exportSystemReport(systemData, type = "excel", options = {}) {
    const {
      temperatureData = [],
      aggregateData = [],
      systemStats = {},
      healthStatus = {},
    } = systemData;

    if (type === "excel") {
      const sheetsData = [
        {
          name: "System Overview",
          data: [
            { metric: "Export Date", value: new Date().toLocaleString() },
            {
              metric: "System Status",
              value: healthStatus.status || "Unknown",
            },
            { metric: "Total Readings", value: systemStats.totalReadings || 0 },
            {
              metric: "Average Temperature",
              value: `${(systemStats.averageTemp || 0).toFixed(2)}°C`,
            },
            {
              metric: "MQTT Status",
              value: healthStatus.mqtt?.connected
                ? "Connected"
                : "Disconnected",
            },
            {
              metric: "Database Status",
              value: healthStatus.database?.connected
                ? "Connected"
                : "Disconnected",
            },
          ],
        },
        {
          name: "Temperature Data",
          data: temperatureData,
          formatters: {
            timestamp: (value) => new Date(value).toLocaleString(),
            temperature: (value) => `${parseFloat(value).toFixed(2)}°C`,
          },
        },
        {
          name: "Daily Aggregates",
          data: aggregateData,
          formatters: {
            date: (value) => new Date(value).toLocaleDateString(),
            avgTemp: (value) => `${parseFloat(value).toFixed(2)}°C`,
            minTemp: (value) => `${parseFloat(value).toFixed(2)}°C`,
            maxTemp: (value) => `${parseFloat(value).toFixed(2)}°C`,
          },
        },
      ];

      return this.exportToExcel(sheetsData, "system_report", {
        multipleSheets: true,
        includeTimestamp: true,
        ...options,
      });
    } else {
      // For CSV, export aggregate data only
      return this.exportAggregateData(aggregateData, "csv", options);
    }
  }
}

// PERBAIKAN: Default exports for backward compatibility
export const exportToExcel = (data, filename, options) =>
  ExportUtils.exportToExcel(data, filename, options);

export const exportToCSV = (data, filename, options) =>
  ExportUtils.exportToCSV(data, filename, options);

export default ExportUtils;
