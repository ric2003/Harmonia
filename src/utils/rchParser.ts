// src/utils/rchParser.ts

// --- Interfaces --- (Keep your existing interfaces)
export interface RchMetadata {
  name?: string;
  localization_i?: number | string;
  serie_initial_data?: string;
  time_units?: string;
  [key: string]: string | number | undefined;
}

export interface RchTimeseriesEntry {
  timestamp: string;
  [key: string]: number | string;
}

export interface RchParsedData {
  metadata: RchMetadata;
  columnHeaders: string[]; // CLEANED keys
  timeseries: RchTimeseriesEntry[];
}

// --- Parser Function ---
export function parseRchFile(rchContent: string): RchParsedData {
  const lines = rchContent.split('\n');
  const metadata: RchMetadata = {};
  let originalHeaders: string[] = [];
  let processedKeys: string[] = [];
  const timeseries: RchTimeseriesEntry[] = [];
  let headerLineIndex = -1;
  let dataStartIndex = -1;

  // --- Pass 1: Find metadata, header line index, and data start index ---
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    if (line === '<BeginTimeSerie>') {
      dataStartIndex = i + 1;
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].trim().length > 0) {
          headerLineIndex = j;
          break;
        }
      }
      continue;
    }
    if (line === '<EndTimeSerie>') break;
    if (dataStartIndex === -1 && line.includes(':')) {
       const parts = line.split(':', 2);
       if (parts.length === 2) {
            const key = parts[0].trim().toLowerCase().replace(/ /g, '_');
            const value = parts[1].trim();
            metadata[key] = value;
       }
    }
  }

  if (headerLineIndex === -1) throw new Error("Could not find header line before '<BeginTimeSerie>'.");
  if (dataStartIndex === -1) throw new Error("Could not find '<BeginTimeSerie>' marker.");

  // --- Process Header Line ---
  // *** CHANGE HERE: Use \s+ and filter for consistency ***
  originalHeaders = lines[headerLineIndex].trim().split(/\s+/).filter(Boolean);

  if (originalHeaders.length === 0) throw new Error(`Failed to parse any headers from line ${headerLineIndex + 1}.`);

  // Create cleaned keys, handling duplicates explicitly
  processedKeys = originalHeaders.map((header, index) => {
    let cleanKey = header.toLowerCase()
      .replace(/[/().\s-]/g, '_').replace(/_+/g, '_')
      .replace(/_$/, '').replace(/^_+/, '')
      .replace(/[°�]/g, 'c');
    if (cleanKey === 'mm') {
      const mmCountBefore = originalHeaders.slice(0, index).filter(h => h.toLowerCase() === 'mm').length;
      cleanKey = (mmCountBefore === 0) ? 'month' : 'minute';
    } else if (cleanKey === 'ss') {
      const ssCountBefore = originalHeaders.slice(0, index).filter(h => h.toLowerCase() === 'ss').length;
      if (ssCountBefore > 0) cleanKey = `ss_${ssCountBefore}`;
    }
    return cleanKey;
  });

  // --- Pass 2: Parse Data Rows ---
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0 || line.startsWith('<')) continue;

    // *** CHANGE HERE: Use \s+ and filter for consistency ***
    const values = line.split(/\s+/).filter(Boolean);

    // CRUCIAL CHECK: Compare value count with processed key count
    if (values.length !== processedKeys.length) {
      // Keep this warning, it's useful if problems persist
      console.warn(`Skipping data line ${i + 1}: Expected ${processedKeys.length} columns based on headers, but found ${values.length} values after splitting with '\\s+'. Line: "${line}"`);
      continue;
    }

    const entry: RchTimeseriesEntry = {} as RchTimeseriesEntry;
    for (let j = 0; j < processedKeys.length; j++) {
      const key = processedKeys[j];
      const valueStr = values[j];
      const numValue = parseFloat(valueStr);
      entry[key] = isNaN(numValue) ? valueStr : numValue;
    }

    const year = entry['yy'] as number;
    const monthVal = entry['month'] as number;
    const day = entry['dd'] as number;
    const hour = entry['hh'] as number;
    const minuteVal = entry['minute'] as number;
    const second = Math.floor(entry['ss'] as number);

    if ([year, monthVal, day, hour, minuteVal, second].some(val => typeof val !== 'number' || isNaN(val))) {
         console.warn(`Skipping timestamp creation for line ${i+1}: Invalid date/time components found.`, entry);
         entry.timestamp = "Invalid Date";
    } else {
         entry.timestamp = `${year}-${String(monthVal).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minuteVal).padStart(2, '0')}:${String(second).padStart(2, '0')}Z`;
    }
    timeseries.push(entry);
  } // End Pass 2

  return {
    metadata,
    columnHeaders: processedKeys,
    timeseries,
  };
}