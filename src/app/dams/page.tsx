"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useDamData } from "@/hooks/useDamData";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertMessage } from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import DataSourceFooter from "@/components/DataSourceFooter";
import { useTranslation } from 'react-i18next';

export default function DamsPage() {
  const { data: damDataResponse, isLoading, error } = useDamData();
  const { t } = useTranslation();
  useTranslatedPageTitle('title.dams');

  // Extract unique dams with their latest data
  const uniqueDams = useMemo(() => {
    if (!damDataResponse?.data) return [];
    
    // Create a map to store the most recent data for each dam
    const damsMap = new Map();
    
    // Process all data to find the most recent entry for each dam
    damDataResponse.data.forEach(item => {
      if (!item.barragem) return;
      
      const currentDam = damsMap.get(item.barragem);
      // If we don't have this dam yet or this record is newer than what we have
      if (!currentDam || (item._time && currentDam._time && item._time > currentDam._time)) {
        damsMap.set(item.barragem, item);
      }
    });
    
    // Convert map to array and sort alphabetically by dam name
    return Array.from(damsMap.values()).sort((a, b) => {
      return a.barragem && b.barragem 
        ? a.barragem.localeCompare(b.barragem) 
        : 0;
    });
  }, [damDataResponse]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error instanceof Error ? error.message : "An error occurred"} />;
  if (!uniqueDams || uniqueDams.length === 0) 
    return <AlertMessage type="warning" message="No dam data available. Please check your connection or try again later." />;

  return (
    <div className="text-darkGray">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueDams.map((dam) => {
          // Calculate fill percentage for the water level indicator
          const fillPercentage = dam.enchimento ? Math.min(dam.enchimento * 100, 100) : 0;
          
          // Determine color based on fill percentage
          const getFillColor = (percentage: number) => {
            if (percentage > 70) return 'bg-green-500';
            if (percentage > 40) return 'bg-yellow-500';
            if (percentage > 20) return 'bg-orange-500';
            return 'bg-red-500';
          };
          
          return (
            <Link href={`/dams/${dam.barragem}`} key={dam.barragem}>
              <li className="p-4 border border-gray200 rounded-lg shadow h-full w-full cursor-pointer hover:shadow-md transition-shadow">
                <div className="mb-4 w-full h-40 bg-gray100 rounded relative overflow-hidden">
                  {/* Water level visualization */}
                  <div 
                    className={`absolute bottom-0 left-0 right-0 ${getFillColor(fillPercentage)} transition-all`} 
                    style={{ height: `${fillPercentage}%` }}
                  ></div>
                  
                  {/* Dam icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  {/* Percentage overlay */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                    {fillPercentage.toFixed(0)}%
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold">{dam.barragem}</h2>
                <p className="text-gray600 text-sm">
                  {t('dam.lastUpdated')}: {dam._time ? new Date(dam._time).toLocaleDateString('en-GB') : 'N/A'}
                </p>
                
              </li>
            </Link>
          );
        })}
      </ul>
      
      <DataSourceFooter 
        textKey="dam.dataSource"
        linkKey="dam.sir"
        linkUrl="https://sir.dgadr.gov.pt/outras/reserva-de-agua-nas-albufeiras"
      />
    </div>
  );
} 