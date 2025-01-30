"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface ExcelData {
  [key: string]: string | number | null;
}

export default function ExcelUploader() {
  const [data, setData] = useState<ExcelData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Please upload a valid Excel file (.xlsx or .xls).");
      return;
    }

    try {
      // Read file as ArrayBuffer instead of binary string
      const arrayBuffer = await file.arrayBuffer();

      // Parse the workbook from the array
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      // You can customize which sheet to parse, here we take the first one
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON with minimal data transformation
      const parsedData: ExcelData[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: true, // keep data as is (faster, less overhead)
      });

      setData(parsedData);
    } catch (err) {
      setError("Failed to parse the Excel file.");
    }
  };

  return (
    <div className="p-4">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-4 p-2 border border-darkGray rounded text-darkGray"
      />

      {error && <p className="text-red-600">{error}</p>}

      {data.length > 0 && (
        <div className="overflow-x-auto text-darkGray">
          <table className="w-full border-collapse border border-darkGray">
            <thead>
              <tr className="bg-background">
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="border border-darkGray p-2">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border border-darkGrey">
                  {Object.values(row).map((value, colIndex) => (
                    <td key={colIndex} className="border border-darkGrey p-2">
                      {value !== null ? value.toString() : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
