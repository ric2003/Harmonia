'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl, { Map, GeolocateControl, Marker } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getStations } from '@/services/api';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Station {
  id: string;
  estacao: string;
  loc: string;
  lat: number;
  lon: number;
}

interface MapComponentProps {
  selectedStationId: string | null;
  onMarkerHover: ((stationId: string | null) => void) | null;
}

const MapComponent = ({ selectedStationId, onMarkerHover }: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);

  // Fetch stations directly in the MapComponent
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getStations();
        setStations(data);
        setError(null);
      } catch {
        setError('Failed to load stations');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  useEffect(() => {
    if (!mapContainer.current || loading || error) return;

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

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [loading, error]);

  // Update markers when stations data changes
  useEffect(() => {
    if (!map.current || loading || error) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    stations.forEach(station => {
      const marker = new mapboxgl.Marker({
        color: selectedStationId === station.id ? '#FF0000' : '#3B82F6'
      })
      .setLngLat([station.lon, station.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <h3 class="font-bold">${station.estacao}</h3>
        <p>${station.loc}</p>
      `))
      .addTo(map.current!);

      // Add hover interactions
      const element = marker.getElement();
      element.addEventListener('mouseenter', () => onMarkerHover && onMarkerHover(station.id));
      element.addEventListener('mouseleave', () => onMarkerHover && onMarkerHover(null));

      markers.current.push(marker);
    });

    // Center map if station is selected
    if (selectedStationId) {
      const selectedStation = stations.find(s => s.id === selectedStationId);
      if (selectedStation) {
        map.current.flyTo({
          center: [selectedStation.lon, selectedStation.lat],
          zoom: 12
        });
      }
    }
  }, [stations, selectedStationId, loading, error, onMarkerHover]);

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center text-black">
        <p>Loading stations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default MapComponent;