import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L, { Layer, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RchParsedData } from '@/utils/rchParser';
import { getParsedRchData } from '@/services/simulationService';
import { AlertMessage } from "@/components/ui/AlertMessage";
import { Feature, Geometry } from 'geojson';
import { useTranslation } from 'react-i18next';
import i18next, { t } from 'i18next';
import { getLocationName, GeoapifyLocation } from '@/services/geoapifyLocation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Brush
} from 'recharts';


interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: Array<Feature>;
}

interface TimeSeriesData {
  timestamp: string;
  [key: string]: number | string;
}

// Parameter descriptions are now handled through translations

// Tooltip component
const Tooltip: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="tooltip-container group relative inline-block">
    <span className="tooltip-trigger">{title}</span>
    <div className="tooltip-content pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-slate-100 opacity-0 shadow-lg transition-all duration-200 ease-in-out group-hover:opacity-100">
      {description}
      <div className="tooltip-arrow absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

// Function to format the date in dd/mm/yyyy
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    // Get the current language from i18next
    const currentLang = i18next.language || 'en';
    // For date formatting, we'll stick with numeric format for consistency
    // but use the language's preferred date separator
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    // Different date formats based on language
    if (currentLang === 'pt') {
      return `${day}/${month}/${year}`; // Portuguese format: dd/mm/yyyy
    } else {
      return `${day}/${month}/${year}`; // Default format: dd/mm/yyyy
    }
  } catch {
    return dateString;
  }
};

const TimeSeriesChart: React.FC<{
  data: TimeSeriesData[];
  dataKey: string;
  label: string;
  color?: string;
}> = ({ data, dataKey, label, color = "#8884d8" }) => {  
  const yearTicks = Array.from(
    new Map(
      data
        .slice() // clone para não mexer no original
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // ordem crescente
        .map((d) => [new Date(d.timestamp).getFullYear(), d.timestamp]) // [ano, timestamp]
    ).values()
  );

  // Format date for brush to show only month/year
  const formatBrushDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getFullYear().toString();
  };

  // Get unit for the current parameter
  const getYAxisLabel = (parameterKey: string): string => {
    const unitMap: { [key: string]: string } = {
      'flowout_m3_s': 'm³/s',
      'ammonia_mg_l': 'mg/L',
      'dissolved_phosphorus_mg_l': 'mg/L',
      'dissolved_oxygen_mg_l': 'mg/L',
      'nitrate_mg_l': 'mg/L',
      'nitrite_mg_l': 'mg/L',
      'organic_nitrogen_mg_l': 'mg/L',
      'organic_phosphorus_mg_l': 'mg/L',
      'saturation_oxygen_mg_l': 'mg/L',
      'temperature_cc': '°C',
      'sediments_tons': 'tons'
    };
    return unitMap[parameterKey] || '';
  };

  return (
    <div className="h-[300px] w-full m-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-300)" />
          <XAxis
            dataKey="timestamp"
            ticks={yearTicks}
            tickFormatter={(dateStr) => new Date(dateStr).getFullYear().toString()}
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 12, fontWeight: 'bold' }}
            label={{ value: t('simulationMap.dateControls.year'), position: 'outside' }}
          />
          <YAxis 
            tick={{ fontSize: 14, fontWeight: 'bold' }} 
            label={{ value: getYAxisLabel(dataKey), angle: 0, position: 'top' }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            dot={false}
            name={label}
          />
          <Brush 
            dataKey="timestamp" 
            height={30} 
            stroke="var(--primary)"
            fill="var(--background)"
            tickFormatter={formatBrushDate}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const SimulationMap: React.FC = () => {
  const { t } = useTranslation();
  const today = new Date();
  const todayFormatted = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

  const [localizData, setLocalizData] = useState<GeoJsonFeatureCollection | null>(null);
  const [riv1Data, setRiv1Data] = useState<GeoJsonFeatureCollection | null>(null);
  const [loadingGeoJson, setLoadingGeoJson] = useState<boolean>(true);
  const [errorGeoJson, setErrorGeoJson] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedRchData, setSelectedRchData] = useState<RchParsedData | null>(null);
  const [loadingRch, setLoadingRch] = useState<boolean>(false);
  const [errorRch, setErrorRch] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayFormatted);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [locationName, setLocationName] = useState<GeoapifyLocation | null>(null);
  const lastClickedLayerRef = useRef<L.Path | null>(null);
  const [selectedParameter, setSelectedParameter] = useState('flowout_m3_s');
  const parameters = t('simulationMap.parameters', { returnObjects: true }) as {
    [key: string]: { label: string; description: string };
  };



  const mapCenter: L.LatLngExpression = [38.8, -8.5];
  const initialZoom: number = 9;

  // Base style for the points
  const pointStyle = useMemo(() => ({
    radius: 20,
    fillColor: "#ff7800",
    color: "#000",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
  }), []);

  // Helper function to update selected date
  const updateSelectedDate = (year: number, month: number, day: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    // If the day is greater than what is available in the month, adjust it to the last day
    const validDay = day > daysInMonth ? daysInMonth : day;
    setSelectedDay(validDay);
    const newDateStr = `${validDay.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    setSelectedDate(newDateStr);
  };

  // useEffect to update the selected date when year/month or simulation data changes
  useEffect(() => {
    if (selectedRchData?.timeseries) {
      updateSelectedDate(selectedYear, selectedMonth, selectedDay);
    }
  }, [selectedYear, selectedMonth, selectedRchData, selectedDay]);

  // useEffect to load GeoJSON data
  useEffect(() => {
    const fetchData = async () => {
      setLoadingGeoJson(true);
      setErrorGeoJson(null);
      try {
        const [localizResponse, riv1Response] = await Promise.all([
          fetch('/geojson/localiz.geojson'),
          fetch('/geojson/riv1.geojson')
        ]);

        if (!localizResponse.ok || !riv1Response.ok) {
          throw new Error('Network response was not ok for one or both GeoJSON files.');
        }
        const localizJson: GeoJsonFeatureCollection = await localizResponse.json();
        const riv1Json: GeoJsonFeatureCollection = await riv1Response.json();
        
        // Transform coordinates for river data (smaller adjustment)
        const transformRiverCoordinates = (coords: number[]): number[] => {
          // Add ~0.0015° to latitude (moving north)
          // Subtract ~0.0015° from longitude (moving west)
          return [coords[0] - 0.0015, coords[1] + 0.0015];
        };

        // Transform coordinates for location points (larger adjustment)
        const transformLocationCoordinates = (coords: number[]): number[] => {
          // Add ~0.001° to latitude (moving north)
          // Subtract ~0.001° from longitude (moving west)
          return [coords[0] - 0.001, coords[1] + 0.001];
        };

        // Transform point coordinates
        if (localizJson.features) {
          localizJson.features.forEach(feature => {
            if (feature.geometry.type === 'Point' && feature.geometry.coordinates) {
              feature.geometry.coordinates = transformLocationCoordinates(feature.geometry.coordinates);
            }
          });
        }

        // Transform river coordinates
        if (riv1Json.features) {
          riv1Json.features.forEach(feature => {
            if (feature.geometry.type === 'MultiLineString' && feature.geometry.coordinates) {
              feature.geometry.coordinates.forEach(line => {
                line.forEach((point, index) => {
                  line[index] = transformRiverCoordinates(point);
                });
              });
            }
          });
        }
        
        setLocalizData(localizJson);
        setRiv1Data(riv1Json);
      } catch (err: Error | unknown) {
        console.error('Error fetching GeoJSON:', err instanceof Error ? err.message : 'Unknown error');
        setErrorGeoJson(err instanceof Error ? err.message : 'Failed to load map base data');
      } finally {
        setLoadingGeoJson(false);
      }
    };
    fetchData();
  }, []);

  // useEffect to fetch RCH data when a location is selected
  useEffect(() => {
    if (selectedLocationId === null || selectedLocationId === undefined) {
      setSelectedRchData(null);
      return;
    }

    const fetchRchData = async () => {
      setLoadingRch(true);
      setErrorRch(null);
      setSelectedRchData(null);

      try {
        const data = await getParsedRchData(selectedLocationId.toString());
        setSelectedRchData(data);
        setErrorRch(null);
      } catch (err: Error | unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while fetching data';
        console.error(`Error loading simulation data:`, errorMessage);
        setErrorRch(errorMessage);
        setSelectedRchData(null);
      } finally {
        setLoadingRch(false);
      }
    };

    fetchRchData();
  }, [selectedLocationId]);

  // Function to reset point style
  const resetPointStyle = useCallback(() => {
    if (lastClickedLayerRef.current) {
      lastClickedLayerRef.current.setStyle(pointStyle);
      // Also reset radius if it's a CircleMarker
      if (lastClickedLayerRef.current instanceof L.CircleMarker) {
        lastClickedLayerRef.current.setRadius(pointStyle.radius);
      }
      lastClickedLayerRef.current = null;
    }
  }, [pointStyle]);

  // Handler for closing panel
  const handleClosePanel = useCallback(() => {
    setIsPanelVisible(false);
    resetPointStyle();
    setSelectedLocationId(null);
    setLocationName(null);
  }, [resetPointStyle]);

  // Function to fetch location name
  const fetchLocationName = async (coordinates: number[]) => {
    try {
      // Geoapify expects coordinates as [latitude, longitude]
      // But GeoJSON uses [longitude, latitude], so we need to reverse them
      const location = await getLocationName(coordinates[1], coordinates[0]);
      setLocationName(location);
    } catch (error) {
      console.error('Error fetching location name:', error);
      setLocationName(null);
    }
  };

  // Handler for clicking on map points - improved for mobile
  const onEachFeaturePoint = useCallback((feature: Feature<Geometry>, layer: Layer) => {
    if (feature.properties && feature.properties.id) {
      const locationId = feature.properties.id;
      
      // Add hover effects for desktop
      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          if (layer instanceof L.CircleMarker && selectedLocationId !== locationId) {
            layer.setStyle({ 
              fillColor: 'orange', 
              color: 'red', 
              weight: 3, 
              fillOpacity: 0.9
            });
            layer.setRadius(22); // Set radius separately for CircleMarker
          }
        },
        mouseout: (e: LeafletMouseEvent) => {
          if (layer instanceof L.CircleMarker && selectedLocationId !== locationId) {
            layer.setStyle(pointStyle);
            layer.setRadius(pointStyle.radius);
          }
        },
        click: async (e: LeafletMouseEvent) => {
          // Prevent event bubbling
          L.DomEvent.stopPropagation(e);
          
          // If clicking the same point that's already selected
          if (selectedLocationId === locationId) {
            handleClosePanel();
            setLocationName(null);
            return;
          }

          resetPointStyle();
          setSelectedLocationId(locationId);
          setIsPanelVisible(true);

          // Get coordinates and fetch location name
          if (feature.geometry.type === 'Point' && feature.geometry.coordinates) {
            await fetchLocationName(feature.geometry.coordinates);
          }

          if (layer instanceof L.CircleMarker) {
            layer.setStyle({ 
              fillColor: 'orange', 
              color: 'red', 
              weight: 4, // Thicker border for selected state
              fillOpacity: 0.9
            });
            layer.setRadius(24); // Larger for selected state
            lastClickedLayerRef.current = layer;
          }
        }
      });
    } else {
      console.warn("Feature found without properties or id:", feature);
    }
  }, [selectedLocationId, handleClosePanel, resetPointStyle, pointStyle]);

  const pointToLayer = (feature: Feature<Geometry>, latlng: L.LatLngExpression): L.Layer => {
    return L.circleMarker(latlng, pointStyle);
  }

  if (loadingGeoJson) return <div>{t('simulationMap.loading')}</div>;
  if (errorGeoJson) return <div style={{ color: 'red' }}>{t('simulationMap.error', { message: errorGeoJson })}</div>;

  // Helper function to format values (optional but useful)
  const formatValue = (value: number | string | undefined | null, decimalPlaces: number = 2): string => {
      if (value === null || value === undefined) return 'N/A';
      const num = Number(value);
      if (isNaN(num)) return 'N/A';
      return num.toFixed(decimalPlaces);
  }


  // Get current entry based on selected date
  const getCurrentEntry = () => {
    if (!selectedRchData?.timeseries || !selectedDate) return null;
    return selectedRchData.timeseries.find(entry => formatDate(entry.timestamp) === selectedDate);
  };

  // Helper function to get unique years from timeseries
  const getUniqueYears = (): number[] => {
    if (!selectedRchData?.timeseries) return [];
    const years = [...new Set(selectedRchData.timeseries.map(entry =>
      new Date(entry.timestamp).getFullYear()
    ))];
    return years.sort();
  };

  // Calculate the number of days in the current month
  const daysInCurrentMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  return (
    <div className="flex flex-col h-75vh relative">
      {/* Map Container with responsive heights */}
      <div className={`w-full transition-all duration-300 ease-in-out relative z-0 ${
        isPanelVisible 
          ? 'h-[35vh]'
          : 'h-[75vh]'
      }`}>
        <div 
          className="glass-card h-full w-full overflow-hidden"
          style={{
            touchAction: 'pan-x pan-y',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          <MapContainer
            center={mapCenter}
            zoom={initialZoom}
            style={{ 
              height: '100%', 
              width: '100%',
              touchAction: 'pan-x pan-y'
            }}
            className="rounded-lg overflow-hidden"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {riv1Data && <GeoJSON data={riv1Data} style={() => ({ color: '#007bff', weight: 2, opacity: 0.8 })} />}
            {localizData && (
              <GeoJSON
                data={localizData}
                pointToLayer={pointToLayer}
                onEachFeature={onEachFeaturePoint}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {/* Data Display Section */}
      {selectedLocationId !== null && isPanelVisible && (
        <div className="w-full py-2 sm:py-4 glass-card flex-shrink-0 relative max-h-[65vh] sm:max-h-[55vh] lg:max-h-[40vh] overflow-y-auto z-10">
          {/* Location Name Display */}
          {locationName && (
            <div className="mb-2 sm:mb-4 px-2 sm:px-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray700">
                {locationName.city || locationName.county || locationName.formatted}
              </h2>
              <p className="text-xs sm:text-sm text-gray700">
                {[locationName.county, locationName.state, locationName.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={handleClosePanel}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 glass-card text-gray700 hover:text-primary p-2 sm:p-2 rounded-full shadow-md transition-all duration-200 hover:glass-card z-20 touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 5.293a1 1 0 010 1.414L11.414 10l3.293 3.293a1 1 0 01-1.414 1.414L10 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 10 5.293 6.707a1 1 0 011.414-1.414L10 8.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="px-2 sm:px-4">
            <div className="glass-card p-2 sm:p-3 mb-2 sm:mb-4 rounded-lg">
              <select id="parameterSelector"
                  className="w-full p-2 glass-light rounded-md text-gray700 border-0 focus:ring-2 focus:ring-primary/50 focus:outline-none text-sm sm:text-base"
                  value={selectedParameter}
                  onChange={(e) => setSelectedParameter(e.target.value)}
                  style={{ minHeight: '44px' }}
                >
                  {Object.keys(parameters).map((key) => (
                    <option key={key} value={key} className="bg-white text-gray700">
                      {parameters[key].label}
                    </option>
                  ))}
                </select>
            </div>
            
            {/* Time Series Charts */}
            <div className="space-y-2 sm:space-y-4">
              <div className="glass-card p-2 sm:p-4 rounded-lg">
                {selectedRchData && (
                  <TimeSeriesChart
                    data={selectedRchData.timeseries}
                    dataKey={selectedParameter}
                    label={parameters[selectedParameter]?.label}
                    color="#2B96F3"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-4 px-2 sm:px-4 mt-2 sm:mt-4">
            {loadingRch && (
              <div className="space-y-3">
                {/* Date Selection Controls Skeleton */}
                <div className="glass-card p-2 sm:p-4 rounded-lg">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="w-20 sm:w-32">
                      <div className="h-4 sm:h-5 w-8 sm:w-12 bg-gray-200/50 rounded mb-1 animate-pulse"></div>
                      <div className="h-6 sm:h-7 w-full bg-gray-200/50 rounded animate-pulse"></div>
                    </div>
                    <div className="w-20 sm:w-32">
                      <div className="h-3 w-8 sm:w-12 bg-gray-200/50 rounded mb-1 animate-pulse"></div>
                      <div className="h-6 sm:h-7 w-full bg-gray-200/50 rounded animate-pulse"></div>
                    </div>
                    <div className="w-20 sm:w-32">
                      <div className="h-3 w-8 sm:w-12 bg-gray-200/50 rounded mb-1 animate-pulse"></div>
                      <div className="h-6 sm:h-7 w-full bg-gray-200/50 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Data Grid Skeleton */}
                <div className="glass-card p-2 sm:p-4 rounded-lg">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-sm">
                    {[...Array(11)].map((_, index) => (
                      <div key={index} className="glass-card p-2 rounded shadow-sm">
                        <div className="h-3 w-8 sm:w-12 bg-gray-200/50 rounded mb-1 animate-pulse"></div>
                        <div className="h-4 sm:h-5 w-6 sm:w-10 bg-gray-200/50 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {errorRch && (
              <div className="glass-card p-2 sm:p-4 rounded-lg">
                <AlertMessage message={errorRch} type='error'/>
              </div>
            )}

            {selectedRchData && !loadingRch && !errorRch && (
              <div>
                {selectedRchData.timeseries && selectedRchData.timeseries.length > 0 ? (
                  <div className="space-y-2 sm:space-y-4">
                    {/* Date Selection Controls */}
                    <div className="glass-card p-2 sm:p-4 rounded-lg">
                      <div className="flex flex-wrap gap-2 sm:gap-3 items-end">
                        <div className="w-20 sm:w-24 md:w-32">
                          <label className="block text-xs font-medium text-gray700 mb-1">{t('simulationMap.dateControls.day')}</label>
                          <select
                              className="w-full py-2 px-2 sm:px-3 glass-light rounded-md text-xs sm:text-sm text-gray700 border-0 focus:ring-2 focus:ring-primary/50 focus:outline-none touch-manipulation"
                              value={selectedDay}
                              onChange={(e) => {
                              const newDay = Number(e.target.value);
                              updateSelectedDate(selectedYear, selectedMonth, newDay);
                              }}
                              style={{ minHeight: '40px' }}
                          >
                              {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => (
                              <option key={day} value={day} className="bg-white text-gray700">
                                  {day}
                              </option>
                              ))}
                          </select>
                        </div>

                        <div className="w-20 sm:w-24 md:w-32">
                          <label className="block text-xs font-medium text-gray700 mb-1">{t('simulationMap.dateControls.month')}</label>
                          <select
                            className="w-full py-2 px-2 sm:px-3 glass-light rounded-md text-xs sm:text-sm text-gray700 border-0 focus:ring-2 focus:ring-primary/50 focus:outline-none touch-manipulation"
                            value={selectedMonth}
                            onChange={(e) => {
                              const newMonth = Number(e.target.value);
                              setSelectedMonth(newMonth);
                              updateSelectedDate(selectedYear, newMonth, selectedDay);
                            }}
                            style={{ minHeight: '40px' }}
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                              const currentLang = i18next.language || 'en';
                              const monthName = new Date(2000, month - 1, 1).toLocaleString(currentLang, { month: 'long' });
                              return (
                                <option key={month} value={month} className="bg-white text-gray700">
                                  {monthName}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="w-20 sm:w-24 md:w-32">
                          <label className="block text-xs font-medium text-gray700 mb-1">{t('simulationMap.dateControls.year')}</label>
                          <select
                            className="w-full py-2 px-2 sm:px-3 glass-light rounded-md text-xs sm:text-sm text-gray700 border-0 focus:ring-2 focus:ring-primary/50 focus:outline-none touch-manipulation"
                            value={selectedYear}
                            onChange={(e) => {
                              const newYear = Number(e.target.value);
                              setSelectedYear(newYear);
                              updateSelectedDate(newYear, selectedMonth, selectedDay);
                            }}
                            style={{ minHeight: '40px' }}
                          >
                            {getUniqueYears().map((year) => (
                              <option key={year} value={year} className="bg-white text-gray700">{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Data Display */}
                    {selectedDate && getCurrentEntry() && (
                      <>
                        <div className="glass-card p-2 sm:p-4 rounded-lg">
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.flowout_m3_s.label')} description={t('simulationMap.parameters.flowout_m3_s.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.flowout_m3_s)}</div>
                            </div>
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.ammonia_mg_l.label')} description={t('simulationMap.parameters.ammonia_mg_l.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.ammonia_mg_l)}</div>
                            </div>
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.dissolved_phosphorus_mg_l.label')} description={t('simulationMap.parameters.dissolved_phosphorus_mg_l.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.dissolved_phosphorus_mg_l)}</div>
                            </div>
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.dissolved_oxygen_mg_l.label')} description={t('simulationMap.parameters.dissolved_oxygen_mg_l.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.dissolved_oxygen_mg_l)}</div>
                            </div>
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.nitrate_mg_l.label')} description={t('simulationMap.parameters.nitrate_mg_l.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.nitrate_mg_l)}</div>
                            </div>
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.nitrite_mg_l.label')} description={t('simulationMap.parameters.nitrite_mg_l.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.nitrite_mg_l)}</div>
                            </div>
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.organic_nitrogen_mg_l.label')} description={t('simulationMap.parameters.organic_nitrogen_mg_l.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.organic_nitrogen_mg_l)}</div>
                            </div>
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.organic_phosphorus_mg_l.label')} description={t('simulationMap.parameters.organic_phosphorus_mg_l.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.organic_phosphorus_mg_l)}</div>
                            </div>
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.saturation_oxygen_mg_l.label')} description={t('simulationMap.parameters.saturation_oxygen_mg_l.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.saturation_oxygen_mg_l)}</div>
                            </div>
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.temperature_cc.label')} description={t('simulationMap.parameters.temperature_cc.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.temperature_cc)}</div>
                            </div>
                            <div className="glass-card p-2 sm:p-3 rounded-lg shadow-sm hover:glass-card transition-all duration-200 touch-manipulation">
                              <div className="text-xs text-gray700 mb-1">
                                <Tooltip title={t('simulationMap.parameters.sediments_tons.label')} description={t('simulationMap.parameters.sediments_tons.description')} />
                              </div>
                              <div className="font-medium text-primary text-xs sm:text-sm">{formatValue(getCurrentEntry()?.sediments_tons)}</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="glass-card p-2 sm:p-4 rounded-lg">
                    <p className="text-gray700 text-xs sm:text-sm">{t('simulationMap.noData')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationMap;
