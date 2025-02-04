"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { FixedSizeList as List } from "react-window";//sudo npm install --save-dev @types/react-window

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
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Parse workbook and pick the first sheet
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON
      const parsedData: ExcelData[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: true,
      });

      setData(parsedData);
    } catch (err) {
      setError("Failed to parse the Excel file.");
    }
  };

  // If there’s data, extract column headers from the first row.
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // Build a grid template string with one equal-width column per header.
  const gridTemplateColumns = columns.map(() => "1fr").join(" ");

  // The row renderer for react-window.
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
  const row = data[index];
  return (
    <div
      style={{ ...style, display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
      className="border-b border-gray-200"
    >
      {columns.map((col, colIndex) => (
        <div
          key={colIndex}
          className="p-2 border-r border-gray-200 overflow-hidden whitespace-nowrap text-ellipsis"
        >
          {row[col] !== null && row[col] !== undefined ? row[col].toString() : ""}
        </div>
      ))}
    </div>
  );
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
        <div className="text-darkGray">
          <div
            className="grid bg-background border-b-2 border-text-darkGray"
            style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
          >
            {columns.map((col, index) => (
              <div
                key={index}
                className="p-2 font-bold border-r border-gray-300"
              >
                {col}
              </div>
            ))}
          </div>

          <List
            height={500}
            itemCount={data.length}
            itemSize={35}
            width="100%"
          >
            {Row}
          </List>
        </div>
      )}
    </div>
  );
  
}
