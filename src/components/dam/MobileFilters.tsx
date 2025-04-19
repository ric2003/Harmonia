import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FilterState {
  filterDam: string;
  filterStartDate: string;
  filterEndDate: string;
  filterMinVolume: string;
  filterMaxVolume: string;
  filterMinCotaLida: string;
  filterMaxCotaLida: string;
  filterMinEnchimento: string;
  filterMaxEnchimento: string;
  filterMinVolumeUtil: string;
  filterMaxVolumeUtil: string;
  volumeUtilPreset: string;
  sortField: string;
  sortDirection: "lowest" | "highest";
}

interface MobileFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  onReset: () => void;
}

export default function MobileFilters({ filters, setFilters, onReset }: MobileFiltersProps) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterClick = (filterType: string) => {
    if (activeFilter === filterType) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filterType);
    }
  };

  const handleReset = () => {
    onReset();
    setActiveFilter(null);
  };

  // Quick filter presets for enchimento (reservoir filling levels)
  const enchimentoPresets = [
    { name: t('mobile.filters.critical'), value: '0-0.19', color: 'bg-red-500' },
    { name: t('mobile.filters.low'), value: '0.2-0.39', color: 'bg-orange-400' },
    { name: t('mobile.filters.medium'), value: '0.4-0.69', color: 'bg-yellow-400' },
    { name: t('mobile.filters.high'), value: '0.7-1', color: 'bg-green-500' }
  ];
  
  // Quick filter presets for volume total
  const volumePresets = [
    { name: t('mobile.filters.low'), value: '0-50', color: 'bg-red-500' },
    { name: t('mobile.filters.medium'), value: '50-125', color: 'bg-orange-400' },
    { name: t('mobile.filters.high'), value: '125-175', color: 'bg-yellow-400' },
    { name: t('mobile.filters.veryHigh'), value: '175-5000', color: 'bg-green-500' }
  ];
  
  // Quick filter presets for cota lida (read level)
  const cotaPresets = [
    { name: t('mobile.filters.low'), value: '0-50', color: 'bg-red-500' },
    { name: t('mobile.filters.medium'), value: '50-100', color: 'bg-orange-400' },
    { name: t('mobile.filters.high'), value: '100-200', color: 'bg-yellow-400' },
    { name: t('mobile.filters.veryHigh'), value: '200-1000', color: 'bg-green-500' }
  ];
  
  // Quick filter presets for volume util
  const volumeUtilPresets = [
    { name: t('mobile.filters.low'), value: '0-50', color: 'bg-red-500' },
    { name: t('mobile.filters.medium'), value: '50-100', color: 'bg-orange-400' },
    { name: t('mobile.filters.high'), value: '100-200', color: 'bg-yellow-400' },
    { name: t('mobile.filters.veryHigh'), value: '200-5000', color: 'bg-green-500' }
  ];
  
  const applyEnchimentoPreset = (presetRange: string) => {
    const [min, max] = presetRange.split('-');
    setFilters({
      ...filters,
      filterMinEnchimento: min,
      filterMaxEnchimento: max
    });
  };
  
  const applyVolumePreset = (presetRange: string) => {
    const [min, max] = presetRange.split('-');
    setFilters({
      ...filters,
      filterMinVolume: min,
      filterMaxVolume: max
    });
  };
  
  const applyCotaPreset = (presetRange: string) => {
    const [min, max] = presetRange.split('-');
    setFilters({
      ...filters,
      filterMinCotaLida: min,
      filterMaxCotaLida: max
    });
  };
  
  const applyVolumeUtilPreset = (presetRange: string) => {
    const [min, max] = presetRange.split('-');
    setFilters({
      ...filters,
      filterMinVolumeUtil: min,
      filterMaxVolumeUtil: max
    });
  };

  // Check if filters are active
  const hasActiveFilters = filters.filterDam || 
    filters.filterStartDate || 
    filters.filterEndDate ||
    filters.filterMinCotaLida !== "" ||
    filters.filterMaxCotaLida !== "" ||
    filters.filterMinEnchimento !== "" ||
    filters.filterMaxEnchimento !== "" ||
    filters.filterMinVolume !== "" ||
    filters.filterMaxVolume !== "" ||
    filters.filterMinVolumeUtil !== "" ||
    filters.filterMaxVolumeUtil !== "";

  return (
    <>
      <div className="bg-primary p-4 rounded-xl relative z-20">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-lg font-bold">{t('dam.monitoring.title')}</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-white flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('mobile.filters.filterBtn')}
            {hasActiveFilters && (
              <span className="ml-3 inline-block w-3 h-3 bg-yellow-500 rounded-full"/>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-background p-4 shadow-lg border-b border-gray200 animate-slideDown">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-darkGray font-semibold">{t('mobile.filters.title')}</h3>
            {hasActiveFilters && (
              <button 
                onClick={handleReset}
                className="text-primary text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('mobile.filters.reset')}
              </button>
            )}
          </div>

          {/* Filter categories */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => handleFilterClick('dam')}
              className={`text-center p-2 rounded-lg border text-xs font-medium ${
                activeFilter === 'dam' 
                  ? 'bg-primary text-white border-primary'
                  : 'bg-backgroundColor text-darkGray border-lightGray'
              } ${filters.filterDam ? 'ring-2 ring-primary/30' : ''}`}
            >
              {t('mobile.filters.dam')}
            </button>
            <button
              onClick={() => handleFilterClick('date')}
              className={`text-center p-2 rounded-lg border text-xs font-medium ${
                activeFilter === 'date' 
                  ? 'bg-primary text-white border-primary'
                  : 'bg-backgroundColor text-darkGray border-lightGray'
              } ${filters.filterStartDate || filters.filterEndDate ? 'ring-2 ring-primary/30' : ''}`}
            >
              {t('mobile.filters.date')}
            </button>
            <button
              onClick={() => handleFilterClick('cota')}
              className={`text-center p-2 rounded-lg border text-xs font-medium ${
                activeFilter === 'cota' 
                  ? 'bg-primary text-white border-primary'
                  : 'bg-backgroundColor text-darkGray border-lightGray'
              } ${filters.filterMinCotaLida || filters.filterMaxCotaLida ? 'ring-2 ring-primary/30' : ''}`}
            >
              {t('mobile.filters.cota')}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            
            <button
              onClick={() => handleFilterClick('enchimento')}
              className={`text-center p-2 rounded-lg border text-xs font-medium ${
                activeFilter === 'enchimento' 
                  ? 'bg-primary text-white border-primary'
                  : 'bg-backgroundColor text-darkGray border-lightGray'
              } ${filters.filterMinEnchimento || filters.filterMaxEnchimento ? 'ring-2 ring-primary/30' : ''}`}
            >
              {t('mobile.filters.enchimento')}
            </button>
            <button
              onClick={() => handleFilterClick('volume')}
              className={`text-center p-2 rounded-lg border text-xs font-medium ${
                activeFilter === 'volume' 
                  ? 'bg-primary text-white border-primary'
                  : 'bg-backgroundColor text-darkGray border-lightGray'
              } ${filters.filterMinVolume || filters.filterMaxVolume ? 'ring-2 ring-primary/30' : ''}`}
            >
              {t('mobile.filters.volume')}
            </button>
            <button
              onClick={() => handleFilterClick('volumeUtil')}
              className={`text-center p-2 rounded-lg border text-xs font-medium ${
                activeFilter === 'volumeUtil' 
                  ? 'bg-primary text-white border-primary'
                  : 'bg-backgroundColor text-darkGray border-lightGray'
              } ${filters.filterMinVolumeUtil || filters.filterMaxVolumeUtil ? 'ring-2 ring-primary/30' : ''}`}
            >
              {t('mobile.filters.volumeUtil')}
            </button>
          </div>

          {/* Filter content based on selected category */}
          {activeFilter === 'dam' && (
            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm mb-3 animate-fadeIn">
              <label className="block text-xs font-medium text-darkGray mb-2">
                {t('mobile.filters.damName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={filters.filterDam}
                  onChange={(e) => setFilters({ ...filters, filterDam: e.target.value })}
                  placeholder={t('mobile.filters.searchDam')}
                  className="pl-10 w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray"
                />
              </div>
            </div>
          )}

          {activeFilter === 'date' && (
            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm mb-3 animate-fadeIn">
              <label className="block text-xs font-medium text-darkGray mb-2">
                {t('mobile.filters.selectDates')}
              </label>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray500 block mb-1">{t('mobile.filters.startDate')}</span>
                  <input
                    type="date"
                    value={filters.filterStartDate}
                    onChange={(e) => setFilters({ ...filters, filterStartDate: e.target.value })}
                    className="w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray500 block mb-1">{t('mobile.filters.endDate')}</span>
                  <input
                    type="date"
                    value={filters.filterEndDate}
                    onChange={(e) => setFilters({ ...filters, filterEndDate: e.target.value })}
                    className="w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray"
                  />
                </div>
              </div>
            </div>
          )}

          {activeFilter === 'enchimento' && (
            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm animate-fadeIn">
              <label className="block text-xs font-medium text-darkGray mb-2">
                {t('mobile.filters.fillLevel')}
              </label>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {enchimentoPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => applyEnchimentoPreset(preset.value)}
                    className={`flex items-center p-2 rounded-lg border border-lightGray ${
                      filters.filterMinEnchimento === preset.value.split('-')[0] &&
                      filters.filterMaxEnchimento === preset.value.split('-')[1]
                        ? 'bg-gray50 ring-2 ring-primary'
                        : 'bg-backgroundColor'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${preset.color} mr-2`}></span>
                    <span className="text-xs font-medium text-darkGray">{preset.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs text-gray500 block mb-1">{t('mobile.filters.min')}</span>
                  <input
                    type="number"
                    value={filters.filterMinEnchimento}
                    onChange={(e) => {
                      const newMin = e.target.value;
                      if (newMin === "" || parseFloat(newMin) < parseFloat(filters.filterMaxEnchimento)) {
                        setFilters({ ...filters, filterMinEnchimento: newMin });
                      }
                    }}
                    placeholder="0"
                    min="0"
                    className="w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray500 block mb-1">{t('mobile.filters.max')}</span>
                  <input
                    type="number"
                    value={filters.filterMaxEnchimento}
                    onChange={(e) => {
                      const newMax = e.target.value;
                      if (newMax === "" || parseFloat(newMax) > parseFloat(filters.filterMinEnchimento)) {
                        setFilters({ ...filters, filterMaxEnchimento: newMax });
                      }
                    }}
                    placeholder="100"
                    min="1"
                    className="w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray text-sm"
                  />
                </div>
              </div>
      
            </div>
          )}

          {activeFilter === 'volume' && (
            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm animate-fadeIn">
              <label className="block text-xs font-medium text-darkGray mb-2">
                {t('dam.filters.volumeTotal')}
              </label>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {volumePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => applyVolumePreset(preset.value)}
                    className={`flex items-center p-2 rounded-lg border border-lightGray ${
                      filters.filterMinVolume === preset.value.split('-')[0] &&
                      filters.filterMaxVolume === preset.value.split('-')[1]
                        ? 'bg-gray50 ring-2 ring-primary'
                        : 'bg-backgroundColor'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${preset.color} mr-2`}></span>
                    <span className="text-xs font-medium text-darkGray">{preset.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs text-gray500 block mb-1">{t('dam.filters.minVolume')}</span>
                  <input
                    type="number"
                    value={filters.filterMinVolume}
                    onChange={(e) => setFilters({ ...filters, filterMinVolume: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray500 block mb-1">{t('dam.filters.maxVolume')}</span>
                  <input
                    type="number"
                    value={filters.filterMaxVolume}
                    onChange={(e) => setFilters({ ...filters, filterMaxVolume: e.target.value })}
                    placeholder="5000"
                    min="0"
                    className="w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeFilter === 'cota' && (
            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm animate-fadeIn">
              <label className="block text-xs font-medium text-darkGray mb-2">
                {t('dam.filters.cotaLida')}
              </label>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {cotaPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => applyCotaPreset(preset.value)}
                    className={`flex items-center p-2 rounded-lg border border-lightGray ${
                      filters.filterMinCotaLida === preset.value.split('-')[0] &&
                      filters.filterMaxCotaLida === preset.value.split('-')[1]
                        ? 'bg-gray50 ring-2 ring-primary'
                        : 'bg-backgroundColor'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${preset.color} mr-2`}></span>
                    <span className="text-xs font-medium text-darkGray">{preset.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs text-gray500 block mb-1">{t('dam.filters.minCota')}</span>
                  <input
                    type="number"
                    value={filters.filterMinCotaLida}
                    onChange={(e) => setFilters({ ...filters, filterMinCotaLida: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray500 block mb-1">{t('dam.filters.maxCota')}</span>
                  <input
                    type="number"
                    value={filters.filterMaxCotaLida}
                    onChange={(e) => setFilters({ ...filters, filterMaxCotaLida: e.target.value })}
                    placeholder="1000"
                    min="0"
                    className="w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeFilter === 'volumeUtil' && (
            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm animate-fadeIn">
              <label className="block text-xs font-medium text-darkGray mb-2">
                {t('dam.filters.volumeUtil')}
              </label>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {volumeUtilPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => applyVolumeUtilPreset(preset.value)}
                    className={`flex items-center p-2 rounded-lg border border-lightGray ${
                      filters.filterMinVolumeUtil === preset.value.split('-')[0] &&
                      filters.filterMaxVolumeUtil === preset.value.split('-')[1]
                        ? 'bg-gray50 ring-2 ring-primary'
                        : 'bg-backgroundColor'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${preset.color} mr-2`}></span>
                    <span className="text-xs font-medium text-darkGray">{preset.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs text-gray500 block mb-1">{t('dam.filters.minVolume')}</span>
                  <input
                    type="number"
                    value={filters.filterMinVolumeUtil}
                    onChange={(e) => setFilters({ ...filters, filterMinVolumeUtil: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray500 block mb-1">{t('dam.filters.maxVolume')}</span>
                  <input
                    type="number"
                    value={filters.filterMaxVolumeUtil}
                    onChange={(e) => setFilters({ ...filters, filterMaxVolumeUtil: e.target.value })}
                    placeholder="5000"
                    min="0"
                    className="w-full bg-backgroundColor border border-lightGray rounded-lg shadow-sm px-3 py-2 focus:ring-primary focus:border-primary text-darkGray text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
} 