'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Thermometer, Bell, BellOff } from 'lucide-react';
import { useConvexStationAlerts, useCreateConvexAlert, useDeleteConvexAlert } from '@/hooks/useConvexAlerts';
import { runConvexAlertChecks } from '@/services/convexAlertService';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationId: string;
  stationName: string;
}

export default function AlertModal({ isOpen, onClose, stationId, stationName }: AlertModalProps) {
  const { t } = useTranslation();
  const { alerts } = useConvexStationAlerts(stationId);
  const createAlert = useCreateConvexAlert();
  const deleteAlert = useDeleteConvexAlert();
  
  const existingAlert = alerts.find(alert => alert.type === 'avgTemp');
  
  const [threshold, setThreshold] = useState(30);
  const [channels] = useState(['toast']); // Only website notifications
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showDeleteMessage, setShowDeleteMessage] = useState(false);

  useEffect(() => {
    if (existingAlert) {
      setThreshold(existingAlert.threshold);
    }
  }, [existingAlert]);

  const handleSave = async () => {
    try {
      await createAlert.mutateAsync({
        stationId,
        type: 'avgTemp',
        threshold,
        channels,
      });
      
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error saving alert:', error);
    }
  };

  const handleDelete = async () => {
    if (existingAlert) {
      try {
        await deleteAlert.mutateAsync(existingAlert.id);
        setShowDeleteMessage(true);
        setTimeout(() => {
          setShowDeleteMessage(false);
          onClose();
        }, 2000);
      } catch (error) {
        console.error('Error deleting alert:', error);
      }
    }
  };

  // Test function to manually trigger alert checking (for development/demo purposes)
  {/*const handleTestAlert = async () => {
    try {
      console.log(`Testing alert for station ${stationId}...`);
      await runConvexAlertChecks(stationId);
      console.log('Test alert check completed');
    } catch (error) {
      console.error('Error testing alert:', error);
    }
  };*/}

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-gray200 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray200">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray700">
              {t('notifications.temperatureAlert')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {showSuccessMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{t('notifications.alertSaved')}</p>
          </div>
        )}

        {showDeleteMessage && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{t('notifications.alertDeleted')}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray700 mb-2">
              {t('notifications.station', { stationName })}
            </h3>
            <p className="text-sm text-gray500">
              {t('notifications.setupAlerts')}
            </p>
          </div>

          <div className="space-y-4">
            {/* Temperature Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray700 mb-2">
                {t('notifications.enableAlert')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-gray700"
                  min="0"
                  max="50"
                  step="0.5"
                />
                <span className="text-sm text-gray-600">°C</span>
              </div>
              <p className="text-xs text-gray500 mt-1">
                {t('notifications.websiteNotification')}
              </p>
            </div>

            {/* Existing Alert Info */}
            {existingAlert && (
              <div className="glass-card p-3 bg-blue100 border border-blue-200">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('notifications.tempThreshold', { threshold: existingAlert.threshold })}
                </p>
                {existingAlert.lastTriggered ? (
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    {t('notifications.lastTriggered', { 
                      date: new Date(existingAlert.lastTriggered).toLocaleString() 
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    {t('notifications.neverTriggered')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {existingAlert && (
              <button
                onClick={handleDelete}
  
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <BellOff className="w-4 h-4" />
                {t('notifications.delete')}
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t('notifications.cancel')}
            </button>
            <button
              onClick={handleSave}

              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              {t('notifications.save')}
            </button>
          </div>
        </div>

        {/* Development Test Section */}
        {/*<div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-800 mb-2">Development Test:</p>
          <button
            onClick={handleTestAlert}
            className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
          >
            Test Alert Check
          </button>
        </div> */}
      </div>
    </div>
  );
} 