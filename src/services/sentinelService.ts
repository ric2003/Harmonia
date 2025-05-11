// services/sentinelService.ts
export const INSTANCE_ID = "d9c2453d-b6d8-45da-bc65-3c9bddd9555a";

export type FilterKey = 
  | "1_TRUE_COLOR"
  | "3_NDVI"
  | "5-MOISTURE-INDEX1"
  | "4-FALSE-COLOR-URBAN";

export function buildSentinelWMS(filter: FilterKey) {
  const to   = new Date().toISOString();
  const from = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const TIME = `${from}/${to}`;

  return {
    url: `https://services.sentinel-hub.com/ogc/wms/${INSTANCE_ID}`,
    params: {
      service:    "WMS",
      version:    "1.3.0",
      layers:     filter,
      styles:     "",
      format:     "image/png",
      transparent:true,
      time:       TIME,
      maxcc:      100,
      mosaickingOrder: "leastCC",
      showlogo:   false,
    },
  };
}


/*import axios from "axios";
import qs from "qs";

const TOKEN_URL = "https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token";
const PROCESS_URL = "https://services.sentinel-hub.com/api/v1/process";

export type SentinelFilter = 'natural' | 'ndvi' | 'moisture' | 'urban';

const now = new Date();
const to = now.toISOString();
const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();


const evalScripts: Record<SentinelFilter, string> = {
  natural: `//VERSION=3
function setup() {
  return {
    input: ["B02", "B03", "B04"],
    output: { bands: 3 }
  };
}
function evaluatePixel(sample) {
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
}`,
  ndvi: `//VERSION=3
let viz = ColorRampVisualizer.createWhiteGreen();

function evaluatePixel(samples) {
    let val = index(samples.B08, samples.B04);
    val = viz.process(val);
    val.push(samples.dataMask);
    return val;
}

function setup() {
  return {
    input: [{
      bands: [
        "B04",
        "B08",
        "dataMask"
      ]
    }],
    output: {
      bands: 4
    }
  }
}`,
  moisture: `//VERSION=3
let viz = ColorRampVisualizer.createBlueRed();

function evaluatePixel(samples) {
    let val = index(samples.B8A, samples.B11);
    val = viz.process(val);
    val.push(samples.dataMask);
    return val;
}

function setup() {
  return {
    input: [{
      bands: [
        "B8A",
        "B11",
        "dataMask"
      ]
    }],
    output: {
      bands: 4
    }
  }
}`,
  urban: `//VERSION=3
function setup() {
  return {
    input: ["B12", "B11", "B04"],
    output: { bands: 3 }
  };
}

function evaluatePixel(sample) {
  return [2.5 * sample.B12, 2.5 * sample.B11, 2.5 * sample.B04];
}`
};

// Function to get the access token using client credentials
async function getAccessToken(): Promise<string> {
  const client_id = process.env.NEXT_PUBLIC_SENTINEL_CLIENT_ID;
  const client_secret = process.env.SENTINEL_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    throw new Error("Missing credentials in environment variables.");
  }

  const body = qs.stringify({
    grant_type: "client_credentials",
    client_id,
    client_secret,
  });

  const response = await axios.post(TOKEN_URL, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data.access_token;
}

// Function to call the Processing API and return binary image data
export async function getSentinelImage(bbox?: number[], filter: SentinelFilter = 'natural'): Promise<ArrayBuffer> {
  const token = await getAccessToken();

  // Use provided bbox or default
  const boundingBox = bbox || [13.822174072265625, 45.85080395917834, 14.55963134765625, 46.29191774991382];

  // Build the payload for the Processing API
  const payload = {
    input: {
      bounds: {
        bbox: boundingBox,
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: { from, to },
          },
        },
      ],
    },
    output: {
      width: 512,
      height: 512,
      responses: [
        {
          identifier: "default",
          format: {
            type: "image/png",
          },
        },
      ],
    },
    evalscript: evalScripts[filter],
  };

  // Call the Processing API and get binary image data (as an arraybuffer)
  const processResponse = await axios.post(PROCESS_URL, payload, {
    responseType: "arraybuffer",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Accept": "image/png",
    },
  });

  return processResponse.data;
}*/