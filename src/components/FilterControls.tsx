import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { SentinelFilter } from '@/services/sentinelService'; // Adjust path if needed

interface FilterControlsProps {
  currentFilter: SentinelFilter;
  onFilterChange: (filter: SentinelFilter) => void;
}

// Define filter options directly within the component file
const filterOptions: { value: SentinelFilter; label: string; description: string }[] = [
  {
    value: 'natural',
    label: 'Natural Color',
    description: 'True color representation of the Earth\'s surface'
  },
  {
    value: 'ndvi',
    label: 'Vegetation (NDVI)',
    description: 'Normalized Difference Vegetation Index - Shows plant health and density'
  },
  {
    value: 'moisture',
    label: 'Moisture Index',
    description: 'Shows water content in vegetation and soil'
  },
  {
    value: 'urban',
    label: 'Urban Areas',
    description: 'Highlights built-up areas and urban development'
  }
];

// Define the CSS styles as a template literal string
// Use the CSS variables provided for theme support
const controlStyles = `
  .custom-filter-control-container {
    margin: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    border: none; /* Override Leaflet defaults */
    background: none; /* Override Leaflet defaults */
  }

  .filter-controls-content {
    background-color: var(--backgroundColor);
    color: var(--gray-700);
    padding: 16px;
    border-radius: 8px;
    width: 200px;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out; /* Smooth theme transition */
  }

  .filter-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-700);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.2s ease-in-out;
  }

  .filter-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-button {
    width: 100%;
    background-color: var(--gray-100);
    border: 2px solid transparent;
    border-radius: 6px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--gray-700);
    text-align: left;
    position: relative;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out, border-color 0.2s ease-in-out;
  }

  .filter-button:hover {
    background-color: var(--gray-200);
  }

  .filter-button.active {
    background-color: var(--primary);
    color: var(--white);
    border-color: var(--blue-200);
  }

  .filter-button:focus { /* Remove default outline */
      outline: none;
  }
  .filter-button:focus-visible { /* Style keyboard focus */
      outline: 2px solid var(--primary);
      outline-offset: 2px;
  }

  @media (max-width: 600px) {
    .filter-controls-content {
      width: 180px;
    }
    .filter-button {
      padding: 8px 12px;
      font-size: 13px;
    }
  }
`;

const STYLE_ELEMENT_ID = 'leaflet-custom-filter-styles';

export function FilterControls({ currentFilter, onFilterChange }: FilterControlsProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // --- 1. Inject Styles ---
    // Check if style element already exists, create if not
    let styleElement = document.getElementById(STYLE_ELEMENT_ID);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = STYLE_ELEMENT_ID;
      styleElement.textContent = controlStyles;
      document.head.appendChild(styleElement);
    }

    // --- 2. Create Leaflet Control ---
    const CustomControl = L.Control.extend({
      options: {
        position: 'topright',
      },

      onAdd: function () {
        // Create container without 'leaflet-bar' to avoid default border/bg
        const container = L.DomUtil.create('div', 'leaflet-control custom-filter-control-container');

        // Build the control's content dynamically
        const contentDiv = document.createElement('div');
        contentDiv.className = 'filter-controls-content'; // Class for styling inner box

        const title = document.createElement('h3');
        title.className = 'filter-title';
        title.textContent = 'Layer Type';
        contentDiv.appendChild(title);

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'filter-options';

        filterOptions.forEach(option => {
          const button = document.createElement('button');
          // Set base class + 'active' class conditionally based on the CURRENT prop value
          button.className = `filter-button ${currentFilter === option.value ? 'active' : ''}`;
          button.title = option.description;
          button.textContent = option.label;
          button.setAttribute('aria-pressed', String(currentFilter === option.value));

          // Use the passed onFilterChange prop directly
          button.onclick = (e) => {
            e.stopPropagation(); // Prevent map click
            onFilterChange(option.value);
            // NOTE: The button's visual state (active class) will update
            // automatically when the component re-renders due to
            // the 'currentFilter' prop changing, triggering this useEffect again.
          };

          optionsDiv.appendChild(button);
        });

        contentDiv.appendChild(optionsDiv);
        container.appendChild(contentDiv);

        // Prevent map interactions
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
      },

      onRemove: function () {
        // Clean up if needed, though React usually handles component unmount
      },
    });

    const control = new CustomControl();
    control.addTo(map);

    // --- 3. Cleanup ---
    return () => {
      // Remove the Leaflet control from the map
      if (map && control) {
        map.removeControl(control);
      }

      // Attempt to remove the style element - check existence first
      const styleToRemove = document.getElementById(STYLE_ELEMENT_ID);
      if (styleToRemove) {
        // Check if another instance of this control might still need the styles
        // A simple check might be if there are other '.custom-filter-control-container' elements
        // For simplicity here, we'll remove it. If you have multiple maps/controls,
        // you might need a more robust style management approach.
         document.head.removeChild(styleToRemove);
      }
    };
    // Re-run the effect if the map instance changes, or if the filter changes
    // (to rebuild the control with the correct 'active' button),
    // or if the callback changes (less likely, but good practice).
  }, [map, currentFilter, onFilterChange]);

  return null;
}