import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { SentinelFilter } from '@/services/sentinelService';
import { useTranslation } from 'react-i18next';

interface FilterExplanationProps {
  currentFilter: SentinelFilter;
}

// Define the CSS styles
const explanationStyles = `
  .filter-explanation-container {
    margin: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    border: none;
    background: none;
  }

  .filter-explanation-content {
    background-color: var(--backgroundColor);
    color: var(--gray-700);
    padding: 16px;
    border-radius: 8px;
    width: 250px;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  }

  .filter-explanation-title {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-700);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.2s ease-in-out;
  }

  .filter-explanation-text {
    font-size: 12px;
    line-height: 1.3;
    margin: 0 0 8px 0;
    color: var(--gray-600);
  }

  .color-legend {
    display: flex;
    flex-direction: column;
    margin-top: 8px;
    font-size: 11px;
  }

  .color-scale {
    height: 20px;
    width: 100%;
    margin: 5px 0;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .scale-value {
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
    font-size: 10px;
  }

  .ndvi-scale {
    position: relative;
    display: block;    /* or inline-block */
    width: 100%;
    height: 20px;      /* adjust as needed */
    border-radius: 4px;
    overflow: hidden;  /* clip any overflow */
  }

  .ndvi-scale::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    background: linear-gradient(to right,
      /* bin 1: NDVI < -0.5 (–1 → –0.5 = 0% → 25%) */
      #0c0c0c  0%,  #0c0c0c  25%,
      /* bin 2: –0.5 → 0 = 25% → 50% */
      #eaeaea  25%, #eaeaea  50%,
      /* bin 3: 0 → 0.1 = 50% → 55% */
      #ccc682  50%, #ccc682  55%,
      /* bin 4: 0.1 → 0.2 = 55% → 60% */
      #91bf51  55%, #91bf51  60%,
      /* bin 5: 0.2 → 0.3 = 60% → 65% */
      #70a33f  60%, #70a33f  65%,
      /* bin 6: 0.3 → 0.4 = 65% → 70% */
      #4f892d  65%, #4f892d  70%,
      /* bin 7: 0.4 → 0.5 = 70% → 75% */
      #306d1c  70%, #306d1c  75%,
      /* bin 8: 0.5 → 0.6 = 75% → 80% */
      #0f540a  75%, #0f540a  80%,
      /* bin 9: 0.6 → 1.0 = 80% → 100% */
      #004400  80%, #004400 100%
    );
  }
  .ndmi-scale::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    background: linear-gradient(to right,
      #800000 0%,     /* very dry */
      #ff0000 25%,    /* dry */
      #ffff00 50%,    /* neutral */
      #00ffff 70%,    /* moist */
      #0000ff 85%,    /* wet */
      #000080 100%    /* saturated */
    );
  }

  @media (max-width: 600px) {
    .filter-explanation-content {
      width: 220px;
    }
  }
`;

// Translation keys for filter details
const filterTranslationKeys: Record<SentinelFilter, { titleKey: string, descriptionKey: string, hasScale: boolean }> = {
  natural: {
    titleKey: "filterExplanation.natural.title",
    descriptionKey: "filterExplanation.natural.description",
    hasScale: false
  },
  ndvi: {
    titleKey: "filterExplanation.ndvi.title",
    descriptionKey: "filterExplanation.ndvi.description",
    hasScale: true
  },
  moisture: {
    titleKey: "filterExplanation.moisture.title",
    descriptionKey: "filterExplanation.moisture.description",
    hasScale: true
  },
  urban: {
    titleKey: "filterExplanation.urban.title",
    descriptionKey: "filterExplanation.urban.description",
    hasScale: false
  }
};

const STYLE_ELEMENT_ID = 'leaflet-filter-explanation-styles';

export function FilterExplanation({ currentFilter }: FilterExplanationProps) {
  const map = useMap();
  const { t } = useTranslation();

  useEffect(() => {
    if (!map) return;

    // Inject styles
    let styleElement = document.getElementById(STYLE_ELEMENT_ID);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = STYLE_ELEMENT_ID;
      styleElement.textContent = explanationStyles;
      document.head.appendChild(styleElement);
    }

    // Create Leaflet control
    const ExplanationControl = L.Control.extend({
      options: {
        position: 'bottomright',
      },

      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control filter-explanation-container');
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'filter-explanation-content';
        
        const title = document.createElement('h3');
        title.className = 'filter-explanation-title';
        
        // Use translation keys
        const filterKey = filterTranslationKeys[currentFilter];
        title.textContent = t(filterKey.titleKey);
        contentDiv.appendChild(title);
        
        const explanationText = document.createElement('p');
        explanationText.className = 'filter-explanation-text';
        explanationText.textContent = t(filterKey.descriptionKey);
        contentDiv.appendChild(explanationText);
        
        // Add color scale if available
        if (filterKey.hasScale) {
          const scaleContainer = document.createElement('div');
          scaleContainer.className = 'color-legend';
          
          const scale = document.createElement('div');
          scale.className = `color-scale ${currentFilter === 'ndvi' ? 'ndvi-scale' : 'ndmi-scale'}`;
          scaleContainer.appendChild(scale);
          
          const values = document.createElement('div');
          values.className = 'scale-value';
          
          // Different scale values for NDVI vs NDMI
          if (currentFilter === 'ndvi') {
            values.innerHTML = `
              <span>-1</span>
              <span>-0.5</span>
              <span>-0.2</span>
              <span>-0.1</span>
              <span>0</span>
              <span>0.2</span>
              <span>0.6</span>
              <span>1</span>
            `;
          } else {
            values.innerHTML = `
              <span>&lt; -0.8</span>
              <span>-0.24</span>
              <span>0</span>
              <span>0.24</span>
              <span>&gt; 0.8</span>
            `;
          }
          
          scaleContainer.appendChild(values);
          contentDiv.appendChild(scaleContainer);
        }
        
        container.appendChild(contentDiv);
        
        // Prevent map interactions
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        
        return container;
      }
    });

    const control = new ExplanationControl();
    control.addTo(map);

    // Cleanup
    return () => {
      if (map && control) {
        map.removeControl(control);
      }

      // Only remove style if no other instances need it
      const styleToRemove = document.getElementById(STYLE_ELEMENT_ID);
      if (styleToRemove && document.querySelectorAll('.filter-explanation-container').length <= 1) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, [map, currentFilter, t]);

  return null;
}