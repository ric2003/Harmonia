// Service for handling alert checking and notifications with Convex
// In a production environment, this would run as a background service

import i18n from '@/i18n/i18n';

interface AlertCheckResult {
  triggered: boolean;
  stationId: string;
  threshold: number;
  currentValue: number;
  alertId: string;
}

interface Station {
  id: string;
  estacao: string;
}

interface Alert {
  id: string;
  stationId: string;
  userId: string;
  threshold: number;
  lastTriggered?: string;
}

interface StationDataEntry {
  date: string;
  air_temp_avg?: string;
}

interface NotificationData {
  userId: string;
  type: 'tempAlert' | 'system' | 'warning';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// Helper function to get translated strings outside React context
function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

// Helper function to get station name with fallback
async function getStationName(stationId: string): Promise<string> {
  try {
    const response = await fetch('/api/stations');
    if (!response.ok) {
      return t('notifications.alertService.stationFallback', { stationId });
    }
    
    const stations: Station[] = await response.json();
    const station = stations.find((s: Station) => s.id === stationId);
    return station ? station.estacao.slice(7) : t('notifications.alertService.stationFallback', { stationId });
  } catch (error) {
    console.error('Error fetching station name:', error);
    return t('notifications.alertService.stationFallback', { stationId });
  }
}

// Helper function to create notification via Convex
async function createConvexNotification(notificationData: NotificationData): Promise<void> {
  try {
    // For now, use the API route as a bridge to Convex
    // In the future, this could be replaced with direct Convex client calls
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Helper function to update alert last triggered via Convex
async function updateAlertLastTriggered(alertId: string): Promise<void> {
  try {
    // For now, use the API route as a bridge to Convex
    const response = await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastTriggered: new Date().toISOString() }),
    });

    if (!response.ok) {
      throw new Error('Failed to update alert');
    }
  } catch (error) {
    console.error('Error updating alert last triggered:', error);
  }
}

export class ConvexAlertService {
  // Check temperature alerts for all stations or a specific station
  static async checkTemperatureAlerts(specificStationId?: string): Promise<AlertCheckResult[]> {
    const results: AlertCheckResult[] = [];
    
    try {
      // Get alerts from Convex via API bridge
      const alertsResponse = await fetch('/api/alerts');
      if (!alertsResponse.ok) return results;
      
      const alerts: Alert[] = await alertsResponse.json();
      const alertsToCheck = specificStationId 
        ? alerts.filter((alert: Alert) => alert.stationId === specificStationId)
        : alerts;

      const locationPrefix = specificStationId 
        ? t('notifications.alertService.forStation', { stationId: specificStationId })
        : '';
      
      if (alertsToCheck.length === 0) {
        console.log(t('notifications.alertService.noAlertsToCheck', { stationId: locationPrefix }));
        return results;
      }

      console.log(t('notifications.alertService.checking', { 
        count: alertsToCheck.length, 
        stationId: locationPrefix 
      }));

      for (const alert of alertsToCheck) {
        try {
          // Get latest 10-minute data for the station
          const dataResponse = await fetch(`/api/stations/${alert.stationId}/min10`);
          if (!dataResponse.ok) continue;

          const stationData: Record<string, StationDataEntry> = await dataResponse.json();
          if (!stationData || Object.keys(stationData).length === 0) continue;

          // Get the most recent entry
          const sortedEntries = Object.entries(stationData).sort(
            ([, a], [, b]) => Number(b.date.slice(8)) - Number(a.date.slice(8))
          );

          if (sortedEntries.length === 0) continue;

          const latestReading = sortedEntries[0][1];
          const currentTemp = parseFloat(latestReading.air_temp_avg || '0');
          
          console.log(t('notifications.alertService.currentTemp', {
            stationId: alert.stationId,
            currentTemp,
            threshold: alert.threshold
          }));
          
          // Check if threshold is exceeded
          if (currentTemp > alert.threshold) {
            // Check last triggered time to prevent spam
            const lastTriggered = alert.lastTriggered ? new Date(alert.lastTriggered) : null;
            const now = new Date();
            const hoursSinceLastTrigger = lastTriggered 
              ? (now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60)
              : 25; // More than 24 hours

            // Only trigger if more than 24 hours since last trigger
            if (hoursSinceLastTrigger >= 24) {
              console.log(t('notifications.alertService.alertTriggered', {
                stationId: alert.stationId,
                currentTemp,
                threshold: alert.threshold
              }));
              
              results.push({
                triggered: true,
                stationId: alert.stationId,
                threshold: alert.threshold,
                currentValue: currentTemp,
                alertId: alert.id,
              });
              
              // Create notification using Convex
              await this.createTemperatureNotification(alert, currentTemp);
              
              // Update alert last triggered time in Convex
              await updateAlertLastTriggered(alert.id);
            } else {
              console.log(t('notifications.alertService.alertCooldown', {
                stationId: alert.stationId,
                hours: hoursSinceLastTrigger.toFixed(1)
              }));
            }
          }
        } catch (error) {
          console.error(`Error checking alert for station ${alert.stationId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking temperature alerts:', error);
    }

    return results;
  }

  // Create temperature notification using Convex
  static async createTemperatureNotification(alert: Alert, currentTemp: number): Promise<void> {
    try {
      const stationName = await getStationName(alert.stationId);
      
      const notification: NotificationData = {
        userId: alert.userId,
        type: 'tempAlert',
        title: t('notifications.alertService.temperatureAlertTitle'),
        message: t('notifications.alertService.temperatureAlertMessage', {
          stationName,
          currentTemp: currentTemp.toFixed(1),
          threshold: alert.threshold
        }),
        data: {
          stationId: alert.stationId,
          threshold: alert.threshold,
          currentValue: currentTemp,
          alertId: alert.id,
        },
      };

      // Create notification in Convex
      await createConvexNotification(notification);
    } catch (error) {
      console.error('Error creating temperature notification:', error);
    }
  }
}

// Function to run periodic alert checks (would be called by a cron job or background worker)
export async function runConvexAlertChecks(specificStationId?: string) {
  const logPrefix = specificStationId ? `for station ${specificStationId}` : 'for all stations';
  console.log(`Running temperature alert checks ${logPrefix}...`);
  
  const results = await ConvexAlertService.checkTemperatureAlerts(specificStationId);
  const triggeredCount = results.filter(r => r.triggered).length;
  
  if (triggeredCount > 0) {
    console.log(t('notifications.alertService.checkComplete', {
      location: logPrefix,
      count: triggeredCount
    }));
  } else {
    console.log(t('notifications.alertService.checkCompleteNoTriggers', {
      location: logPrefix
    }));
  }
  
  return results;
} 