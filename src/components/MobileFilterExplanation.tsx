import { useTranslation } from 'react-i18next';
import { FilterKey } from '@/services/sentinelService';

interface MobileFilterExplanationProps {
  currentFilter: FilterKey;
}

// Translation keys and configuration for filter details
const filterTranslationKeys: Record<FilterKey, { titleKey: string; descriptionKey: string; hasScale: boolean; scaleType?: string }> = {
  "1_TRUE_COLOR": {
    titleKey: "filterExplanation.natural.title",
    descriptionKey: "filterExplanation.natural.description",
    hasScale: false
  },
  "3_NDVI": {
    titleKey: "filterExplanation.ndvi.title",
    descriptionKey: "filterExplanation.ndvi.description",
    hasScale: true,
    scaleType: "ndvi"
  },
  "5-MOISTURE-INDEX1": {
    titleKey: "filterExplanation.moisture.title",
    descriptionKey: "filterExplanation.moisture.description",
    hasScale: true,
    scaleType: "moisture"
  },
  "4-FALSE-COLOR-URBAN": {
    titleKey: "filterExplanation.urban.title",
    descriptionKey: "filterExplanation.urban.description",
    hasScale: false
  }
};

export function MobileFilterExplanation({ currentFilter }: MobileFilterExplanationProps) {
  const { t } = useTranslation();
  
  const { titleKey, descriptionKey, hasScale, scaleType } = filterTranslationKeys[currentFilter];

  return (
    <div className="glass-card p-4 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">
        {t(titleKey)}
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
        {t(descriptionKey)}
      </p>

      {hasScale && (
        <div className="glass-card p-3 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="relative h-4 w-full rounded overflow-hidden border border-gray-300 dark:border-gray-500 mb-2">
            {scaleType === 'ndvi' ? (
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to right, #0c0c0c 0%, #0c0c0c 25%, #eaeaea 25%, #eaeaea 50%, #ccc682 50%, #ccc682 55%, #91bf51 55%, #91bf51 60%, #70a33f 60%, #70a33f 65%, #4f892d 65%, #4f892d 70%, #306d1c 70%, #306d1c 75%, #0f540a 75%, #0f540a 80%, #004400 80%, #004400 100%)'
                }}
              />
            ) : (
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to right, #800000 0%, #ff0000 25%, #ffff00 50%, #00ffff 70%, #0000ff 85%, #000080 100%)'
                }}
              />
            )}
          </div>
          
          <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
            {scaleType === 'ndvi' ? (
              <>
                <span>-1</span>
                <span>-0.5</span>
                <span>-0.2</span>
                <span>-0.1</span>
                <span>0</span>
                <span>0.2</span>
                <span>0.6</span>
                <span>1</span>
              </>
            ) : (
              <>
                <span>&lt; -0.8</span>
                <span>-0.24</span>
                <span>0</span>
                <span>0.24</span>
                <span>&gt; 0.8</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 