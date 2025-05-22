import React, { useEffect, useRef } from 'react';
import { DamData } from './DamTable';
import { useTranslation } from "react-i18next";

interface ReservoirCardProps {
    id: number;
    data: DamData;
    className?: string;
}

export default function TableCard({ id, data, className = '' }: ReservoirCardProps) {
  const fillBarRef = useRef<HTMLDivElement>(null);
  const enchimentoToPercentage = data.enchimento ? Number((data.enchimento * 100).toFixed(0)) : 0;
  const { t } = useTranslation();

  useEffect(() => {
    if (data.enchimento !== undefined) {
      const width = `${enchimentoToPercentage}%`;
      setTimeout(() => {
        if (fillBarRef.current) {
          fillBarRef.current.style.width = width;
        }
      }, 300);
    }
  }, [data.enchimento, enchimentoToPercentage]);

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
            {t('dam.table.cotaLida')}
          </div>
          <div className="font-semibold text-lg text-darkGray">
            {data.cota_lida?.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray50 p-3 rounded-lg">
          <div className="text-gray500 text-sm font-medium mb-1">
            {t('dam.table.volumeTotal')}
          </div>
          <div className="font-semibold text-lg text-darkGray">
            {data.volume_total?.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray50 p-3 rounded-lg">
          <div className="text-gray500 text-sm font-medium mb-1">
            {t('dam.table.volumeUtil')}
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
              className={`absolute top-0 left-0 h-full rounded-full ${
                enchimentoToPercentage < 20 
                  ? 'bg-gradient-to-r from-red-500 to-red-400'
                  : enchimentoToPercentage < 40
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                  : enchimentoToPercentage < 70
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                  : 'bg-gradient-to-r from-green-500 to-green-400'
              }`}
              style={{ width: `${enchimentoToPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}