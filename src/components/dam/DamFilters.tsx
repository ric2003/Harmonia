import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getUniqueDamNames } from '@/services/influx';

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
  volumeUtilPreset: string; // Added for Low/Med/High buttons
  sortField: string;
  sortDirection: "lowest" | "highest";
}

interface DamFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  onReset: () => void;
}

export function DamFilters({ filters, setFilters, onReset }: DamFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useTranslation();

  return (
    <div>
      {/* These styles enable thumbs on range inputs */}
      <style jsx global>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: all;
          width: 16px;
          height: 16px;
          background-color: var(--backgroundColor);
          border-radius: 50%;
          border: 1px solid var(--slate-100);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
        }
      `}</style>

      <div className="px-4 py-3 bg-primary">
        <div className="flex justify-between items-center ">
          <div>
            <h2 className="text-white text-xl font-bold">{t('dam.monitoring.title')}</h2>
          </div>
          <div className="flex items-center">
            {!showFilters && (
              <button
                onClick={onReset}
                className="text-xs text-white hover:text-opacity-80 font-medium flex items-center px-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('dam.monitoring.resetFilters')}
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1.5 bg-background bg-opacity-20 hover:bg-opacity-30 rounded-md text-darkGray font-medium flex items-center text-xs"
            >
              {showFilters ? t('dam.monitoring.hideFilters') : t('dam.monitoring.showFilters')}
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-gray50 border-b">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-darkGray font-semibold text-sm">{t('dam.monitoring.filterData')}</h3>

            <button
              onClick={onReset}
              className="text-xs text-darkGray hover:text-opacity-80 font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('dam.monitoring.resetFilters')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DamNameFilter filters={filters} setFilters={setFilters} />
            <DateRangeFilter filters={filters} setFilters={setFilters} />
            <CotaLidaFilter filters={filters} setFilters={setFilters} />
            <EnchimentoFilter filters={filters} setFilters={setFilters} />
            <VolumeRangeFilter filters={filters} setFilters={setFilters} />
            <VolumeUtilFilter filters={filters} setFilters={setFilters} />
          </div>
        </div>
      )}
    </div>
  );
}

// Individual filter components
function DamNameFilter({ filters, setFilters }: { filters: FilterState; setFilters: (filters: FilterState) => void }) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(filters.filterDam);
  const [uniqueDamNames, setUniqueDamNames] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(filters.filterDam);
  }, [filters.filterDam]);

  useEffect(() => {
    const loadDamNames = async () => {
      try {
        console.log("Loading dam names...");
        const damNamesSet = await getUniqueDamNames();
        const damNamesArray = Array.from(damNamesSet);
        console.log("Loaded dam names:", damNamesArray);
        setUniqueDamNames(damNamesArray);
        
        // If there's an initial filter value, show suggestions for it
        if (filters.filterDam) {
          const filtered = damNamesArray.filter(name => 
            name.toLowerCase().includes(filters.filterDam.toLowerCase())
          );
          setSuggestions(filtered);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error loading dam names:', error);
        setUniqueDamNames([]);
      }
    };
    loadDamNames();
  }); // Only run once on mount

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter suggestions based on input - this is now just a local operation
  const filterSuggestions = (value: string) => {
    if (value.trim() === '') {
      setSuggestions([]);
      return;
    }

    const filtered = uniqueDamNames.filter(name => 
      name.toLowerCase().includes(value.toLowerCase())
    );
    console.log("Filtered suggestions:", filtered);
    setSuggestions(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(true);
    setFilters({ ...filters, filterDam: value });
    filterSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setFilters({ ...filters, filterDam: suggestion });
    setShowSuggestions(false);
  };

  return (
    <div className="bg-backgroundColor p-3 rounded-lg shadow-sm">
      <label className="block text-xs font-medium text-darkGray mb-1.5">{t('dam.filters.damName')}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          name="filterDam"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setShowSuggestions(true);
            filterSuggestions(inputValue);
          }}
          placeholder={t('dam.filters.filterByDamName')}
          className="pl-10 w-full bg-backgroundColor border border-lightGray rounded-md shadow-sm px-3 py-1.5 focus:ring-primary focus:border-primary text-darkGray text-xs"
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-backgroundColor border border-lightGray rounded-md shadow-lg max-h-60 overflow-auto"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-2 text-xs text-darkGray hover:bg-gray100 cursor-pointer"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DateRangeFilter({ filters, setFilters }: { filters: FilterState; setFilters: (filters: FilterState) => void }) {
  const { t } = useTranslation();

  return (
    <div className="bg-backgroundColor p-3 rounded-lg shadow-sm">
      <label className="block text-xs font-medium text-darkGray mb-1.5">{t('dam.filters.dateRange')}</label>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="date"
            value={filters.filterStartDate}
            onChange={(e) => setFilters({ ...filters, filterStartDate: e.target.value })}
            placeholder="DD/MM/YYYY"
            className="w-full bg-backgroundColor border border-lightGray rounded-md shadow-sm px-3 py-1.5 focus:ring-primary focus:border-primary text-darkGray text-xs"
          />

        </div>
        <div className="relative">
          <input
            type="date"
            value={filters.filterEndDate}
            onChange={(e) => setFilters({ ...filters, filterEndDate: e.target.value })}
            placeholder="DD/MM/YYYY"
            className="w-full bg-backgroundColor border border-lightGray rounded-md shadow-sm px-3 py-1.5 focus:ring-primary focus:border-primary text-darkGray text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function VolumeRangeFilter({ filters, setFilters }: { filters: FilterState; setFilters: (filters: FilterState) => void }) {
  const { t } = useTranslation();
  const minVolume = filters.filterMinVolume ? parseInt(filters.filterMinVolume) : 0;
  const maxVolume = filters.filterMaxVolume ? parseInt(filters.filterMaxVolume) : 5000;

  return (
    <div className="bg-backgroundColor p-3 rounded-lg shadow-sm">
      <label className="block text-xs font-medium text-darkGray mb-1.5">{t('dam.filters.volumeTotal')}</label>
      <div className="mt-2 mb-4">
        <div className="h-2 relative w-full bg-gray200 rounded">
          <div
            className="absolute h-2 bg-primary rounded"
            style={{
              left: `${(minVolume / 5000) * 100}%`,
              width: `${((maxVolume - minVolume ) / 5000) * 100}%`
            }}
          ></div>
        </div>
        <div className="flex mt-2 mb-1 w-full relative">
          <input
            type="range"
            min="0"
            max="5000"
            step="50"
            value={minVolume}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (newMin+200 < maxVolume) {
                setFilters({ ...filters, filterMinVolume: e.target.value });
              }
            }}
            className="w-full absolute pointer-events-none appearance-none bg-transparent z-30"
            style={{ height: '10px' }}
          />
          <input
            type="range"
            min="0"
            max="5000"
            step="50"
            value={maxVolume}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (newMax > minVolume+200) {
                setFilters({ ...filters, filterMaxVolume: e.target.value });
              }
            }}
            className="w-full absolute pointer-events-none appearance-none bg-transparent z-30"
            style={{ height: '10px' }}
          />
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray600">{t('dam.filters.minVolume')}: {minVolume}</span>
        <span className="text-xs text-gray600">{t('dam.filters.maxVolume')}: {maxVolume}</span>
      </div>
    </div>
  );
}

function CotaLidaFilter({ filters, setFilters }: { filters: FilterState; setFilters: (filters: FilterState) => void }) {
  const { t } = useTranslation();
  const minCota = filters.filterMinCotaLida ? parseInt(filters.filterMinCotaLida) : 0;
  const maxCota = filters.filterMaxCotaLida ? parseInt(filters.filterMaxCotaLida) : 1000;

  return (
    <div className="bg-backgroundColor p-3 rounded-lg shadow-sm">
      <label className="block text-xs font-medium text-darkGray mb-1.5">{t('dam.filters.cotaLida')}</label>
      <div className="mt-2 mb-4">
        <div className="h-2 relative w-full bg-gray200 rounded">
          <div
            className="absolute h-2 bg-primary rounded"
            style={{
              left: `${((minCota) / 1000) * 100}%`,
              width: `${((maxCota - minCota) / 1000) * 100}%`
            }}
          ></div>
        </div>
        <div className="flex mt-2 mb-1 w-full relative">
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={minCota}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (newMin+40 < maxCota) {
                setFilters({ ...filters, filterMinCotaLida: e.target.value });
              }
            }}
            className="w-full absolute pointer-events-none appearance-none bg-transparent z-30"
            style={{ height: '10px' }}
          />
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={maxCota}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (newMax > minCota+40) {
                setFilters({ ...filters, filterMaxCotaLida: e.target.value });
              }
            }}
            className="w-full absolute pointer-events-none appearance-none bg-transparent z-30"
            style={{ height: '10px' }}
          />
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray600">{t('dam.filters.minCota')}: {minCota}</span>
        <span className="text-xs text-gray600">{t('dam.filters.maxCota')}: {maxCota}</span>
      </div>
    </div>
  );
}

function EnchimentoFilter({ filters, setFilters }: { filters: FilterState; setFilters: (filters: FilterState) => void }) {
  const { t } = useTranslation();
  const minEnch = filters.filterMinEnchimento ? parseFloat(filters.filterMinEnchimento) : 0;
  const maxEnch = filters.filterMaxEnchimento ? parseFloat(filters.filterMaxEnchimento) : 1;

  return (
    <div className="bg-backgroundColor p-3 rounded-lg shadow-sm">
      <label className="block text-xs font-medium text-darkGray mb-1.5">{t('dam.filters.enchimento')}</label>
      <div className="mt-2 mb-4">
        <div className="h-2 relative w-full bg-gray200 rounded">
          <div
            className="absolute h-2 bg-primary rounded"
            style={{
              left: `${minEnch * 100}%`,
              width: `${(maxEnch - minEnch) * 100}%`
            }}
          ></div>
        </div>
        <div className="flex mt-2 mb-1 w-full relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={minEnch}
            onChange={(e) => {
              const newMin = parseFloat(e.target.value);
              if (newMin+0.05 < maxEnch) {
                setFilters({ ...filters, filterMinEnchimento: e.target.value });
              }
            }}
            className="w-full absolute pointer-events-none appearance-none bg-transparent z-30"
            style={{ height: '10px' }}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={maxEnch}
            onChange={(e) => {
              const newMax = parseFloat(e.target.value);
              if (newMax > minEnch+0.05) {
                setFilters({ ...filters, filterMaxEnchimento: e.target.value });
              }
            }}
            className="w-full absolute pointer-events-none appearance-none bg-transparent z-30"
            style={{ height: '10px' }}
          />
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray600">{t('dam.filters.min')}: {(minEnch * 100).toFixed(0)}%</span>
        <span className="text-xs text-gray600">{t('dam.filters.max')}: {(maxEnch * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

function VolumeUtilFilter({ filters, setFilters }: { filters: FilterState; setFilters: (filters: FilterState) => void }) {
  const { t } = useTranslation();
  const minVolumeUtil = filters.filterMinVolumeUtil ? parseInt(filters.filterMinVolumeUtil) : 0;
  const maxVolumeUtil = filters.filterMaxVolumeUtil ? parseInt(filters.filterMaxVolumeUtil) : 5000;

  return (
    <div className="bg-backgroundColor p-3 rounded-lg shadow-sm">
      <label className="block text-xs font-medium text-darkGray mb-1.5">{t('dam.filters.volumeUtil')}</label>
      <div className="mt-2 mb-4">
        <div className="h-2 relative w-full bg-gray200 rounded">
          <div
            className="absolute h-2 bg-primary rounded"
            style={{
              left: `${(minVolumeUtil / 5000) * 100}%`,
              width: `${((maxVolumeUtil - minVolumeUtil) / 5000) * 100}%`
            }}
          ></div>
        </div>
        <div className="flex mt-2 mb-1 w-full relative">
          <input
            type="range"
            min="0"
            max="5000"
            step="50"
            value={minVolumeUtil}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (newMin+200 < maxVolumeUtil) {
                setFilters({
                  ...filters,
                  filterMinVolumeUtil: e.target.value,
                });
              }
            }}
            className="w-full absolute pointer-events-none appearance-none bg-transparent z-30"
            style={{ height: '10px' }}
          />
          <input
            type="range"
            min="0"
            max="5000"
            step="50"
            value={maxVolumeUtil}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (newMax > minVolumeUtil+200) {
                setFilters({
                  ...filters,
                  filterMaxVolumeUtil: e.target.value,
                });
              }
            }}
            className="w-full absolute pointer-events-none appearance-none bg-transparent z-30"
            style={{ height: '10px' }}
          />
        </div>
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray600">{t('dam.filters.minVolume')}: {minVolumeUtil}</span>
        <span className="text-xs text-gray600">{t('dam.filters.maxVolume')}: {maxVolumeUtil}</span>
      </div>
    </div>
  );
}
