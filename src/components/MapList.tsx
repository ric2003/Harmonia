import { Station } from "@/services/irristratService";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface MapListProps {
    stations: Station[];
    selectedStationId: string | null;
    onMarkerHover: (stationId: string | null) => void;
    showMenu: boolean | null;
}

export default function MapList({stations, selectedStationId, onMarkerHover, showMenu}: MapListProps) {
    const [showList, setShowList] = useState(true);

    return (
        <>
            {showMenu && (
                <div className="rounded-lg shadow-md overflow-hidden transition-all duration-300" 
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
        </>
    );
}