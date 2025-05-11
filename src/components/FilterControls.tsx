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
  .custom-filter-control-container { margin: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-radius:8px; border:none; background:none; }
  .filter-controls-content { background-color: var(--backgroundColor, white); color: var(--gray-700, #4a5568); padding: 16px; border-radius:8px; width:200px; transition: background-color 0.2s ease, color 0.2s ease; }
  .filter-title { margin:0 0 12px; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
  .filter-options { display:flex; flex-direction:column; gap:8px; }
  .filter-button { width:100%; background:var(--gray-100,#f7fafc); border:2px solid transparent; border-radius:6px; padding:10px 16px; cursor:pointer; font-size:14px; font-weight:500; text-align:left; transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
  .filter-button:hover { background-color: var(--gray-200, #edf2f7); }
  .filter-button.active { background-color: var(--primary, #4299e1); color: var(--white, white); border-color: var(--blue-200, #bee3f8); }
  .filter-button:focus { outline:none; }
  .filter-button:focus-visible { outline:2px solid var(--primary,#4299e1); outline-offset:2px; }
  @media (max-width:600px) { .filter-controls-content { width:180px; } .filter-button { padding:8px 12px; font-size:13px; } }
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
