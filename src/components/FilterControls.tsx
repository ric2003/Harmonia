import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { FilterKey } from '@/services/sentinelService';

interface FilterControlsProps {
  currentFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
}

// Define filter options (keys only, labels/descriptions come from translations)
const FILTERS: { value: FilterKey; key: string }[] = [
  { value: "1_TRUE_COLOR", key: "natural" },
  { value: "3_NDVI", key: "ndvi" },
  { value: "5-MOISTURE-INDEX1", key: "moisture" },
  { value: "4-FALSE-COLOR-URBAN", key: "urban" },
];

// CSS styles
const controlStyles = `
  .custom-filter-control-container { 
    margin: 10px; 
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); 
    border-radius: 12px; 
    border: 1px solid rgba(255, 255, 255, 0.2); 
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    overflow: hidden;
  }
  .dark .custom-filter-control-container {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  .filter-controls-content { 
    background: transparent; 
    color: #111827; 
    padding: 16px; 
    border-radius: 12px; 
    width: 200px; 
  }
  .dark .filter-controls-content {
    color: #f9fafb;
  }
  .filter-title { 
    margin: 0 0 12px; 
    font-size: 14px; 
    font-weight: 600; 
    text-transform: uppercase; 
    letter-spacing: 0.5px; 
    color: #000000;
  }
  .dark .filter-title {
    color: #ffffff;
  }
  .filter-options { 
    display: flex; 
    flex-direction: column; 
    gap: 8px; 
  }
  .filter-button { 
    width: 100%; 
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(0, 0, 0, 0.1); 
    border-radius: 8px; 
    padding: 12px 16px; 
    cursor: pointer; 
    font-size: 14px; 
    font-weight: 500; 
    text-align: left; 
    color: #1f2937; 
  }
  .dark .filter-button {
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #e5e7eb;
  }
  .filter-button:hover { 
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border-color: rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
  }
  .dark .filter-button:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.3);
  }
  .filter-button.active:hover {
    background: var(--primary, #2B96F3);
    transform: none;
    border-color: rgba(255, 255, 255, 0.3);
  }
  .filter-button.active { 
    background: var(--primary, #2B96F3); 
    color: white; 
    border-color: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 16px rgba(43, 150, 243, 0.3);
  }
  .filter-button:focus { 
    outline: none; 
  }
  .filter-button:focus-visible { 
    outline: 2px solid var(--primary, #2B96F3); 
    outline-offset: 2px; 
  }
  @media (max-width: 600px) { 
    .filter-controls-content { 
      width: 180px; 
      padding: 12px;
    } 
    .filter-button { 
      padding: 10px 12px; 
      font-size: 13px; 
    } 
  }
`;

const STYLE_ELEMENT_ID = 'leaflet-custom-filter-styles';

export function FilterControls({ currentFilter, onFilterChange }: FilterControlsProps) {
  const map = useMap();
  const { t } = useTranslation();

  // Inject styles & add control
  useEffect(() => {
    if (!map) return;

    // inject stylesheet
    if (!document.getElementById(STYLE_ELEMENT_ID)) {
      const styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      styleEl.textContent = controlStyles;
      document.head.appendChild(styleEl);
    }

    // create Leaflet control
    const CustomControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-control custom-filter-control-container');
        const content = document.createElement('div');
        content.className = 'filter-controls-content';

        // title
        const titleEl = document.createElement('h3');
        titleEl.className = 'filter-title';
        titleEl.textContent = t('filterControls.title');
        content.appendChild(titleEl);

        // options
        const optionsEl = document.createElement('div');
        optionsEl.className = 'filter-options';

        FILTERS.forEach(({ value, key }) => {
          const label = t(`filterControls.filters.${key}.label`);
          const description = t(`filterControls.filters.${key}.description`);

          const btn = document.createElement('button');
          btn.className = `filter-button ${currentFilter === value ? 'active' : ''}`;
          btn.title = description;
          btn.textContent = label;
          btn.setAttribute('aria-pressed', String(currentFilter === value));
          btn.onclick = (e) => { e.stopPropagation(); onFilterChange(value); };

          optionsEl.appendChild(btn);
        });

        content.appendChild(optionsEl);
        container.appendChild(content);

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
      }
    });

    const control = new CustomControl();
    control.addTo(map);

    // cleanup
    return () => {
      control.remove();
      const styleToRemove = document.getElementById(STYLE_ELEMENT_ID);
      if (styleToRemove && document.querySelectorAll('.custom-filter-control-container').length <= 1) {
        styleToRemove.remove();
      }
    };
  }, [map, currentFilter, onFilterChange, t]);

  return null;
}
