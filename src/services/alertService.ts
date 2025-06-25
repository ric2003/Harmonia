// Service for handling alert checking and notifications
// In a production environment, this would run as a background service

import i18n from '@/i18n/i18n';

interface UserAlert {
  id: string;
  userId: string;
  stationId: string;
  type: 'avgTemp';
  threshold: number;
  channels: string[];
  lastTriggered?: string;
  createdAt: string;
}

interface AlertCheckResult {
  triggered: boolean;
  stationId: string;
  threshold: number;
  currentValue: number;
  alertId: string;
}

// Helper function to get translated strings outside React context
function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

// Helper function to get station name with fallback
async function getStationName(stationId: string): Promise<string> {
  try {
    const response = await fetch('/api/stations');
    if (!response.ok) return stationId;
    
    const stations = await response.json();
    const station = stations.find((s: { id: string; estacao: string }) => s.id === stationId);
    return station ? station.estacao.slice(7) : stationId;
  } catch {
    return stationId;
  }
}

export class AlertService {
  // Check temperature alerts for all stations or a specific station
  static async checkTemperatureAlerts(specificStationId?: string): Promise<AlertCheckResult[]> {
    // In production, this would:
    // 1. Fetch all active temperature alerts from database
    // 2. Get latest station data from InfluxDB
    // 3. Compare values against thresholds
    // 4. Create notifications for triggered alerts
    
    const results: AlertCheckResult[] = [];
    
    try {
      // Get all active alerts (mock - replace with actual database query)
      const alertsResponse = await fetch('/api/alerts');
      if (!alertsResponse.ok) return results;
      
      const alerts = await alertsResponse.json();
      
      // Filter alerts if checking for a specific station
      const alertsToCheck = specificStationId 
        ? alerts.filter((alert: UserAlert) => alert.stationId === specificStationId)
        : alerts;
      
      if (alertsToCheck.length === 0) {
        const locationText = specificStationId 
          ? t('notifications.alertService.forStation', { stationId: specificStationId })
          : '';
        console.log(t('notifications.alertService.noAlertsToCheck', { stationId: locationText }));
        return results;
      }
      
      const locationText = specificStationId 
        ? t('notifications.alertService.forStation', { stationId: specificStationId })
        : '';
      console.log(t('notifications.alertService.checking', { 
        count: alertsToCheck.length,
        stationId: locationText 
      }));
      
      for (const alert of alertsToCheck) {
        if (alert.type === 'avgTemp') {
          // Get latest 10-minute station data (most recent temperature reading)
          const stationResponse = await fetch(`/api/stations/${alert.stationId}/min10`);
          if (!stationResponse.ok) continue;
          
          const stationData = await stationResponse.json();
          if (!stationData || Object.keys(stationData).length === 0) continue;
          
          // Get the most recent temperature reading from 10-minute data
          const dataEntries = Object.entries(stationData);
          if (dataEntries.length === 0) continue;
          
          // Sort by timestamp to get the latest reading
          const sortedEntries = dataEntries.sort(([, a], [, b]) => {
            const readingA = a as { date: string; hour: string };
            const readingB = b as { date: string; hour: string };
            const timestampA = `${readingA.date} ${readingA.hour}`;
            const timestampB = `${readingB.date} ${readingB.hour}`;
            return timestampB.localeCompare(timestampA);
          });
          
          const latestReading = sortedEntries[0][1] as { air_temp_avg?: string };
          const currentTemp = parseFloat(latestReading.air_temp_avg || '0');
          
          console.log(t('notifications.alertService.currentTemp', {
            stationId: alert.stationId,
            currentTemp: currentTemp.toFixed(1),
            threshold: alert.threshold
          }));
          
          // Check if threshold is exceeded
          if (currentTemp > alert.threshold) {
            // Check if not already triggered recently (prevent spam)
            const lastTriggered = alert.lastTriggered ? new Date(alert.lastTriggered) : null;
            const now = new Date();
            const hoursSinceLastTrigger = lastTriggered 
              ? (now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60)
              : 25; // Default to 25 hours if never triggered
            
            // Only trigger if more than 24 hours since last trigger
            if (hoursSinceLastTrigger >= 24) {
              console.log(t('notifications.alertService.alertTriggered', {
                stationId: alert.stationId,
                currentTemp: currentTemp.toFixed(1),
                threshold: alert.threshold
              }));
              
              results.push({
                triggered: true,
                stationId: alert.stationId,
                threshold: alert.threshold,
                currentValue: currentTemp,
                alertId: alert.id,
              });
              
              // Create notification
              await this.createTemperatureNotification(alert, currentTemp);
              
              // Update alert last triggered time
              await this.updateAlertLastTriggered(alert.id);
            } else {
              console.log(t('notifications.alertService.alertCooldown', {
                stationId: alert.stationId,
                hours: hoursSinceLastTrigger.toFixed(1)
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking temperature alerts:', error);
    }
    
    return results;
  }
  
  private static async createTemperatureNotification(alert: UserAlert, currentTemp: number) {
    try {
      // Get station name for better user experience
      const stationName = await getStationName(alert.stationId);
      
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
            stationName,
            threshold: alert.threshold,
            currentValue: currentTemp,
            alertId: alert.id,
          },
        }),
      });
    } catch (error) {
      console.error('Error creating temperature notification:', error);
    }
  }
  
  private static async updateAlertLastTriggered(alertId: string) {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastTriggered: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to update alert last triggered:', response.status);
      }
    } catch (error) {
      console.error('Error updating alert last triggered:', error);
    }
  }
}

// Function to run periodic alert checks (would be called by a cron job or background worker)
export async function runAlertChecks(specificStationId?: string) {
  const locationText = specificStationId 
    ? t('notifications.alertService.forStation', { stationId: specificStationId })
    : t('common.language.en') === 'English' ? 'for all stations' : 'para todas as estações';
  
  console.log(t('notifications.alertService.checking', { 
    count: '...',
    stationId: locationText 
  }));
  
  const results = await AlertService.checkTemperatureAlerts(specificStationId);
  const triggeredCount = results.filter(r => r.triggered).length;
  
  if (triggeredCount > 0) {
    console.log(t('notifications.alertService.checkComplete', {
      location: locationText,
      count: triggeredCount
    }));
  } else {
    console.log(t('notifications.alertService.checkCompleteNoTriggers', {
      location: locationText
    }));
  }
  
  return results;
} 