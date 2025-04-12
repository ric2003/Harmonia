import React, { useEffect, useRef } from 'react';
import { DamData } from './DamTable';

interface ReservoirCardProps {
    id: number;
    data: DamData;
    className?: string;
}

export default function TableCard({ id, data, className = '' }: ReservoirCardProps) {
  const fillBarRef = useRef<HTMLDivElement>(null);
  const enchimentoToPercentage = data.enchimento ? Number((data.enchimento * 100).toFixed(0)) : 0;

  useEffect(() => {
    if (fillBarRef.current) {
      const width = `${enchimentoToPercentage}%`;
      fillBarRef.current.style.width = '0';
      
      setTimeout(() => {
        if (fillBarRef.current) {
          fillBarRef.current.style.width = width;
        }
      }, 300);
    }
  }, [data.enchimento]);

  return (
    <div className={`bg-backgroundColor rounded-xl shadow-md p-4 mb-5 hover:translate-y-[-2px] hover:shadow-lg ${className}`}>
      <div className="flex items-center mb-4 pb-3 border-b border-gray200">
        <div className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
          {id}
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-lg text-primary">
            {data.barragem}
          </div>
          <div className="text-sm text-darkGray mt-1">
            Data: {data._time}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray50 p-3 rounded-lg">
          <div className="text-gray500 text-sm font-medium mb-1">
            Cota Lida
          </div>
          <div className="font-semibold text-lg text-darkGray">
            {data.cota_lida?.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray50 p-3 rounded-lg">
          <div className="text-gray500 text-sm font-medium mb-1">
            Volume Total
          </div>
          <div className="font-semibold text-lg text-darkGray">
            {data.volume_total?.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray50 p-3 rounded-lg">
          <div className="text-gray500 text-sm font-medium mb-1">
            Volume Útil
          </div>
          <div className="font-semibold text-lg text-darkGray">
            {data.volume_util?.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray50 p-3 rounded-lg">
          <div className="text-gray500 text-sm font-medium mb-1">
            Enchimento
          </div>
          <div className="relative h-8 bg-gray200 dark:bg-gray100 rounded-full overflow-hidden">
            {/* Add overlay for centered text */}
            <div className="absolute inset-0 flex items-center justify-center z-10 text-darkGray font-bold">
              {enchimentoToPercentage}%
            </div>
            <div 
              ref={fillBarRef}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-blue100 rounded-full"
              style={{ width: `${enchimentoToPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}