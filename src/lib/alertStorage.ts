// Shared storage for alerts (in production, use a database)
export interface UserAlert {
  id: string;
  userId: string;
  stationId: string;
  type: 'avgTemp';
  threshold: number;
  channels: string[];
  lastTriggered?: string;
  createdAt: string;
}

// Global storage - in production, this would be a database
declare global {
  // eslint-disable-next-line no-var
  var alertsStorage: UserAlert[] | undefined;
}

// Initialize storage if it doesn't exist
if (!global.alertsStorage) {
  global.alertsStorage = [];
}

export const alertsStorage = global.alertsStorage;

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
} 