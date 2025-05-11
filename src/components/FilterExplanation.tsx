import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { FilterKey } from '@/services/sentinelService';

interface FilterExplanationProps {
  currentFilter: FilterKey;
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
    background-color: var(--backgroundColor, white);
    color: var(--gray-700, #4a5568);
    padding: 16px;
    border-radius: 8px;
    width: 250px;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
    max-height: 50vh;
    overflow-y: auto;
  }

  .filter-explanation-title {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-700, #4a5568);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.2s ease-in-out;
  }

  .filter-explanation-text {
    font-size: 12px;
    line-height: 1.3;
    margin: 0 0 8px 0;
    color: var(--gray-600, #718096);
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

  .ndvi-scale::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    background: linear-gradient(to right,
      #0c0c0c  0%,  #0c0c0c  25%,
      #eaeaea  25%, #eaeaea  50%,
      #ccc682  50%, #ccc682  55%,
      #91bf51  55%, #91bf51  60%,
      #70a33f  60%, #70a33f  65%,
      #4f892d  65%, #4f892d  70%,
      #306d1c  70%, #306d1c  75%,
      #0f540a  75%, #0f540a  80%,
      #004400  80%, #004400 100%
    );
  }

  .moisture-scale::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    background: linear-gradient(to right,
      #800000 0%,
      #ff0000 25%,
      #ffff00 50%,
      #00ffff 70%,
      #0000ff 85%,
      #000080 100%
    );
  }

  @media (max-width: 600px) {
    .filter-explanation-content {
      width: 220px;
    }
  }
`;

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

const STYLE_ELEMENT_ID = 'leaflet-filter-explanation-styles';

export function FilterExplanation({ currentFilter }: FilterExplanationProps) {
  const map = useMap();
  const { t } = useTranslation();

  useEffect(() => {
    if (!map) return;

    // Inject styles once
    if (!document.getElementById(STYLE_ELEMENT_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ELEMENT_ID;
      style.textContent = explanationStyles;
      document.head.appendChild(style);
    }

    // Create the control
    const ExplanationControl = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd() {
        const container = L.DomUtil.create('div','leaflet-control filter-explanation-container hidden lg:block');
        const content = document.createElement('div');
        content.className = 'filter-explanation-content';

        const { titleKey, descriptionKey, hasScale, scaleType } = filterTranslationKeys[currentFilter];
        const titleEl = document.createElement('h3');
        titleEl.className = 'filter-explanation-title';
        titleEl.textContent = t(titleKey);
        content.appendChild(titleEl);

        const textEl = document.createElement('p');
        textEl.className = 'filter-explanation-text';
        textEl.textContent = t(descriptionKey);
        content.appendChild(textEl);

        if (hasScale) {
          const legend = document.createElement('div');
          legend.className = 'color-legend';

          const scale = document.createElement('div');
          scale.className = `color-scale ${scaleType === 'ndvi' ? 'ndvi-scale' : 'moisture-scale'}`;
          legend.appendChild(scale);

          const values = document.createElement('div');
          values.className = 'scale-value';
          if (scaleType === 'ndvi') {
            values.innerHTML = '<span>-1</span><span>-0.5</span><span>-0.2</span><span>-0.1</span><span>0</span><span>0.2</span><span>0.6</span><span>1</span>';
          } else {
            values.innerHTML = '<span>&lt; -0.8</span><span>-0.24</span><span>0</span><span>0.24</span><span>&gt; 0.8</span>';
          }
          legend.appendChild(values);
          content.appendChild(legend);
        }

        container.appendChild(content);
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
      }
    });

    const control = new ExplanationControl();
    control.addTo(map);

    return () => {
      control.remove();
      const styleEl = document.getElementById(STYLE_ELEMENT_ID);
      if (styleEl && document.querySelectorAll('.filter-explanation-container').length <= 1) {
        styleEl.remove();
      }
    };
  }, [map, currentFilter, t]);

  return null;
}
