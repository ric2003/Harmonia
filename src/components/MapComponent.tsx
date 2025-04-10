'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl, { Map, GeolocateControl, Marker } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Station {
  id: string;
  estacao: string;
  loc: string;
  lat: number;
  lon: number;
}

interface MapComponentProps {
  stations: Station[];
  selectedStationId: string | null;
  onMarkerHover: (stationId: string | null) => void;
  onStationSelect: (stationId: string | null) => void;
  shoeMenu: boolean | null;
}

const MapComponent = ({ stations, selectedStationId, onMarkerHover, onStationSelect, shoeMenu }: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showList, setShowList] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [-9.1444, 38.7425],
      zoom: 8
    });

    map.current.addControl(new GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    }), 'top-right');

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when stations data changes or map loads
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    stations.forEach(station => {
      const marker = new mapboxgl.Marker({
        color: selectedStationId === station.id ? '#FF0000' : '#3B82F6'
      })
      .setLngLat([station.lon, station.lat])
      .addTo(map.current!);

      // Add hover interactions
      const element = marker.getElement();
      element.addEventListener('mouseenter', () => onMarkerHover && onMarkerHover(station.id));
      element.addEventListener('mouseleave', () => onMarkerHover && onMarkerHover(null));
      
      // Replace popup with direct navigation on click
      element.addEventListener('click', () => {
        onStationSelect && onStationSelect(station.id);
        router.push(`/stations/${station.id}`);
      });

      markers.current.push(marker);
    });

    // Center map if station is selected
    if (selectedStationId) {
      const selectedStation = stations.find(s => s.id === selectedStationId);
      if (selectedStation) {
        map.current.flyTo({
          center: [selectedStation.lon, selectedStation.lat],
          zoom: 11
        });
      }
    }
  }, [stations, selectedStationId, mapLoaded, onMarkerHover, onStationSelect, router]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Station list panel */}
      {shoeMenu && (
        <div className="absolute top-4 left-4 z-10 rounded-lg shadow-md overflow-hidden transition-all duration-300" 
             style={{ maxHeight: showList ? '60vh' : '40px', width: '250px' }}>
          <div className="p-2 bg-backgroundColor cursor-pointer flex justify-between items-center" 
               onClick={() => setShowList(!showList)}>
            <h3 className="text-sm font-bold text-primary">Lista de Barragens</h3>
            <span className="text-xs text-darkGray">{showList ? '▲' : '▼'}</span>
          </div>
          
          {showList && (
            <div className="p-2 max-h-[calc(60vh-40px)] overflow-y-auto bg-gray100">
              <div className="space-y-1 text-darkGray">
                {stations.map((station) => (
                  <Link 
                    href={`/stations/${station.id}`} 
                    key={station.id}
                    className="block"
                  >
                    <div 
                      className={`p-1.5 rounded-lg flex items-center text-xs ${
                        selectedStationId === station.id 
                          ? "bg-blue50 border-l-4 border-blue-500" 
                          : "bg-gray50 hover:bg-blue50"
                      }`}
                      onMouseEnter={() => onMarkerHover(station.id)}
                      onMouseLeave={() => onMarkerHover(null)}
                    >
                      <MapPin className="h-3 w-3 text-blue-500 mr-1.5" />
                      <span className="truncate">{station.estacao.slice(7)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapComponent;