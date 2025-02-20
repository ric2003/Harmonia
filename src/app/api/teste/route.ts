/*import { InfluxDB, Point } from '@influxdata/influxdb-client';

// InfluxDB Configurations
const url = 'http://localhost:8086';
const token = '532MipF2euYi2dYfkv3DAd49GajiA5Ifenr2Jog-FGV43mdF4lVLQa7E6Y8QPNeozyPY_x1KFazjcMwiLQ7riA=='; 
const org = 'water-wise';
const bucket = 'test-bucket'; 

// Create an InfluxDB client
const client = new InfluxDB({ url, token });
const writeApi = client.getWriteApi(org, bucket, 'ns');
const queryApi = client.getQueryApi(org);

// Function to Write Data
async function writeData() {
    const point = new Point('test_measurement')
        .tag('location', 'test-site')
        .floatField('temperature', 25.3);

    writeApi.writePoint(point);
    await writeApi.close();
    console.log('Data successfully written to InfluxDB.');
}

// Function to Read Data
async function readData() {
    const fluxQuery = `
        from(bucket: "test-bucket")
        |> range(start: -1h)
        |> filter(fn: (r) => r._measurement == "test_measurement")
    `;

    console.log('Querying data...');
    queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
            const obj = tableMeta.toObject(row);
            console.log(`Temperature at ${obj._time}: ${obj._value}°C`);
        },
        error(error) {
            console.error('Query failed:', error);
        },
        complete() {
            console.log('Query completed.');
        }
    });
}

// Run the functions
(async () => {
    await writeData();
    setTimeout(readData, 2000);
})();*/

import { InfluxDB, Point } from '@influxdata/influxdb-client';

// InfluxDB Configurations
/*const url = 'http://localhost:8086';
const token = '532MipF2euYi2dYfkv3DAd49GajiA5Ifenr2Jog-FGV43mdF4lVLQa7E6Y8QPNeozyPY_x1KFazjcMwiLQ7riA==';
const org = 'water-wise';
const bucket = 'dados-barragens'; // Use o mesmo bucket que você configurou

// Create an InfluxDB client
const client = new InfluxDB({ url, token });
const writeApi = client.getWriteApi(org, bucket, 'ns'); // 'ns' for nanosecond precision
const queryApi = client.getQueryApi(org);

// Function to Write Data
async function writeData() {
    const timestamp1 = new Date(2025, 1, 20);
    const timestamp2 = new Date(2025, 1, 21);

    // Array of barragens with unique data
    const barragens1 = [
        { name: 'TestDam1', cota_lida: 249.75, volume_total: 14.19, enchimento: 0.713, volume_util: 13.19 },
        { name: 'TestDam2', cota_lida: 300.50, volume_total: 20.45, enchimento: 0.850, volume_util: 18.25 },
        { name: 'TestDam3', cota_lida: 150.25, volume_total: 10.75, enchimento: 0.650, volume_util: 9.10 },
        { name: 'TestDam4', cota_lida: 400.00, volume_total: 50.00, enchimento: 0.900, volume_util: 45.00 },
        { name: 'TestDam5', cota_lida: 200.00, volume_total: 12.50, enchimento: 0.750, volume_util: 10.00 }
    ];
    const barragens2 = [
        { name: 'TestDam1', cota_lida: 249.75, volume_total: 14.19, enchimento: 0.713, volume_util: 13.19 },
        { name: 'TestDam2', cota_lida: 300.50, volume_total: 20.45, enchimento: 0.850, volume_util: 18.25 },
        { name: 'TestDam3', cota_lida: 150.25, volume_total: 10.75, enchimento: 0.650, volume_util: 9.10 },
        { name: 'TestDam4', cota_lida: 400.00, volume_total: 50.00, enchimento: 0.900, volume_util: 45.00 },
        { name: 'TestDam5', cota_lida: 200.00, volume_total: 12.50, enchimento: 0.750, volume_util: 10.00 }
    ];

    // Loop through each barragem and create a point
    for (const barragem of barragens1) {
        const point = new Point('barragem_data') // Measurement name
            .tag('barragem', barragem.name) // Tag (e.g., Barragem name)
            .floatField('cota_lida', barragem.cota_lida) // Example field
            .floatField('volume_total', barragem.volume_total) // Example field
            .floatField('enchimento', barragem.enchimento) // Example field
            .floatField('volume_util', barragem.volume_util) // Example field
            .timestamp(timestamp1); // Same timestamp for all points

        console.log(`Writing point: ${point.toLineProtocol()}`);
        writeApi.writePoint(point);
    }
    // Loop through each barragem and create a point
    for (const barragem of barragens2) {
        const point = new Point('barragem_data') // Measurement name
            .tag('barragem', barragem.name) // Tag (e.g., Barragem name)
            .floatField('cota_lida', barragem.cota_lida) // Example field
            .floatField('volume_total', barragem.volume_total) // Example field
            .floatField('enchimento', barragem.enchimento) // Example field
            .floatField('volume_util', barragem.volume_util) // Example field
            .timestamp(timestamp2); // Same timestamp for all points

        console.log(`Writing point: ${point.toLineProtocol()}`);
        writeApi.writePoint(point);
    }

    try {
        await writeApi.flush();
        console.log('Data successfully written to InfluxDB.');
    } catch (flushError) {
        console.error('Error flushing points to InfluxDB:', flushError);
    }

    try {
        await writeApi.close();
        console.log('Write API closed successfully.');
    } catch (closeError) {
        console.error('Error closing Write API:', closeError);
    }
}

// Function to Read Data
async function readData() {
    const fluxQuery = `
        from(bucket: "dados-barragens")
        |> range(start: -1h) // Query data from the last hour
        |> filter(fn: (r) => r._measurement == "barragem_data") // Filter by measurement
        |> filter(fn: (r) => r.barragem == "TestDam") // Filter by tag (Barragem name)
    `;

    console.log('Querying data...');
    queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
            const obj = tableMeta.toObject(row);
            console.log(
                `Measurement: ${obj._measurement}, ` +
                `Barragem: ${obj.barragem}, ` +
                `Field: ${obj._field}, ` +
                `Value: ${obj._value}, ` +
                `Time: ${obj._time}`
            );
        },
        error(error) {
            console.error('Query failed:', error);
        },
        complete() {
            console.log('Query completed.');
        }
    });
}

// Run the functions
(async () => {
    await writeData(); // Write test data
    setTimeout(readData, 2000); // Wait 2 seconds before querying
})();
*/
import axios from 'axios';
import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';

function getExcelFileUrl(): string {
    return 'https://sir.dgadr.gov.pt/images/conteudos/imagens/Reservas_agua/2024/Ficheiro_Trimestral_res_agua/Historico_2005_2024_V31DEZ2024.xlsx';
  }

// InfluxDB configurations
const url = 'http://localhost:8086';
const token = '532MipF2euYi2dYfkv3DAd49GajiA5Ifenr2Jog-FGV43mdF4lVLQa7E6Y8QPNeozyPY_x1KFazjcMwiLQ7riA==';
const org = 'water-wise';
const bucket = 'dados-barragens';

const influxdb = new InfluxDB({
    url: 'http://localhost:8086',
    token: '532MipF2euYi2dYfkv3DAd49GajiA5Ifenr2Jog-FGV43mdF4lVLQa7E6Y8QPNeozyPY_x1KFazjcMwiLQ7riA=='})
const writeApi = influxdb.getWriteApi('water-wise', 'dados-barragens', 'ns')
/*const point1 = new Point('barragem_data')
    .tag('barragem', 'TestDam1')
    .floatField('cota_lida', 249.75)

writeApi.writePoint(point1)
writeApi.close().then(() => {
    console.log('Data successfully written to InfluxDB.')
});*/
  
  // Helper function to convert numeric values (replace commas with dots if necessary)
  const parseNumber = (value: any): number | null => {
    if (typeof value === "string") {
      const parsedValue = parseFloat(value.replace(",", "."));
      return isNaN(parsedValue) ? null : parsedValue;
    }
    return Number(value);
  };

export async function GET(request: Request) {
    try {
      const fileUrl = getExcelFileUrl();
      console.log('Downloading Excel from:', fileUrl);
  
      // Download the Excel file
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      if (response.status !== 200) {
        console.error('Error downloading the Excel file:', response.status, response.statusText);
        return NextResponse.json(
          { error: `Failed to download file: ${response.statusText}` },
          { status: response.status }
        );
      }
  
      // Read the workbook and the first sheet
      const workbook = XLSX.read(response.data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  
      console.log(`Excel data read successfully. Number of rows: ${sheetData.length}`);
  
      // Limit processing to the first 5 rows for debugging
      const limitedSheetData = sheetData.slice(0, 2);
      console.log('Processing first 5 rows for debugging.');
  
      // Log detected columns in the first row
      if (limitedSheetData.length > 0) {
        console.log("Detected columns:", Object.keys(limitedSheetData[0] as object));
      }
  
      // Define the type for the row
      type RowType = {
        Barragem: string;
        Cota_Lida_m: string | number;
      };
  
      // Process each row to create and write points to InfluxDB
      for (const row of limitedSheetData as RowType[]) {
        // Parse the date
  
        // Parse numeric fields
        const cotaLida = parseNumber(row['Cota_Lida_m']);
  
        // Create the point
        const point = new Point('barragem_data')
          .tag('barragem', row['Barragem'])
          .floatField('cota_lida', cotaLida!)
  
        // Log the line protocol for debugging
        console.log(`Line protocol: ${point.toLineProtocol()}`);
  
        // Write the point to InfluxDB
        writeApi.writePoint(point);
      }
  
      // Ensure all points are sent before closing the connection
      try {
        await writeApi.flush();
        console.log('All points flushed successfully.');
      } catch (flushError) {
        console.error('Error flushing points to InfluxDB:', flushError);
      }
      
      try {
        await writeApi.close();
        console.log('Write API closed successfully.');
      } catch (closeError) {
        console.error('Error closing Write API:', closeError);
      }
  
      console.log('Data successfully written to InfluxDB.');
      return NextResponse.json({ message: 'Data imported successfully' });
    } catch (error: any) {
      console.error('Error processing the Excel file:', error);
      return NextResponse.json(
        { error: 'Failed to process the Excel file' },
        { status: 500 }
      );
    }
  }