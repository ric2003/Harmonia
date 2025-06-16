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
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    overflow: hidden;
  }
  .dark .filter-explanation-container {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .filter-explanation-content {
    background: transparent;
    color: #111827;
    padding: 16px 20px;
    border-radius: 12px;
    width: 500px;
    max-height: 40vh;
    overflow-y: auto;
  }
  .dark .filter-explanation-content {
    color: #f9fafb;
  }

  .filter-explanation-title {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: #000000;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .dark .filter-explanation-title {
    color: #ffffff;
  }

  .filter-explanation-text {
    font-size: 13px;
    line-height: 1.5;
    margin: 0 0 10px 0;
    color: #1f2937;
  }
  .dark .filter-explanation-text {
    color: #e5e7eb;
  }

  .color-legend {
    display: flex;
    flex-direction: column;
    margin-top: 10px;
    font-size: 11px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 8px;
    padding: 10px 12px;
  }
  .dark .color-legend {
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .color-scale {
    height: 16px;
    width: 100%;
    margin: 6px 0 4px 0;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }
  .dark .color-scale {
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .scale-value {
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
    font-size: 9px;
    color: #374151;
    font-weight: 600;
  }
  .dark .scale-value {
    color: #d1d5db;
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

  @media (max-width: 768px) {
    .filter-explanation-content {
      width: 350px;
      padding: 14px 16px;
    }
  }
  @media (max-width: 600px) {
    .filter-explanation-content {
      width: 300px;
      padding: 12px 14px;
    }
    .filter-explanation-text {
      font-size: 12px;
      line-height: 1.4;
    }
  }
  @media (max-width: 480px) {
    .filter-explanation-content {
      width: 260px;
      padding: 10px 12px;
    }
    .filter-explanation-title {
      font-size: 13px;
    }
    .filter-explanation-text {
      font-size: 11px;
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
