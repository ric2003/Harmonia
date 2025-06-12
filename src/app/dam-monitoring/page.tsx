"use client"
import { useState, useCallback, useMemo } from "react";
import { DamMonitoringTable } from "@/components/dam/DamTable";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertMessage } from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import DataSource from "@/components/DataSource";
import { useDamData } from "@/hooks/useDamData";
import TableCard from "@/components/dam/TableCard";
import PageController from "@/components/dam/PageController";
import { useTranslation } from 'react-i18next';
import MobileFilters from "@/components/dam/MobileFilters";

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

const initialFilterState: FilterState = {
  filterDam: "",
  filterStartDate: "",
  filterEndDate: "",
  filterMinVolume: "",
  filterMaxVolume: "",
  filterMinCotaLida: "",
  filterMaxCotaLida: "",
  filterMinEnchimento: "",
  filterMaxEnchimento: "",
  filterMinVolumeUtil: "",
  filterMaxVolumeUtil: "",
  volumeUtilPreset: "",
  sortField: "",
  sortDirection: "highest"
};

export default function DamMonitoringPage() {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [currentPage, setCurrentPage] = useState(1);
  const { 
    data: damDataResponse, 
    isLoading, 
    error
  } = useDamData();
  const { t } = useTranslation();
  
  useTranslatedPageTitle('title.damMonitoring');

  // Show a distinct loading state for initial load vs. background refresh
  const isInitialLoading = isLoading;
  
  const handleSort = useCallback((field: string) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: field === prev.sortField && prev.sortDirection === "highest" ? "lowest" : "highest"
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilterState);
    setCurrentPage(1);
  }, []);

  const filteredData = useMemo(() => {
    if (!damDataResponse || !damDataResponse.data) return [];
    
    let result = [...damDataResponse.data];
    
    if (filters.filterDam) {
      result = result.filter(item => 
        item.barragem?.toString().toLowerCase().includes(filters.filterDam.toLowerCase())
      );
    }
    
    if (filters.filterStartDate) {
      result = result.filter(item => 
        item._time && item._time >= filters.filterStartDate
      );
    }
    
    if (filters.filterEndDate) {
      result = result.filter(item => 
        item._time && item._time <= filters.filterEndDate
      );
    }
    
    if (filters.filterMinVolume) {
      const minValue = parseFloat(filters.filterMinVolume);
      result = result.filter(item => {
        const value = parseFloat(String(item.volume_total));
        return !isNaN(value) && value >= minValue;
      });
    }
    
    if (filters.filterMaxVolume) {
      const maxValue = parseFloat(filters.filterMaxVolume);
      result = result.filter(item => {
        const value = parseFloat(String(item.volume_total));
        return !isNaN(value) && value <= maxValue;
      });
    }
    
    if (filters.filterMinCotaLida) {
      const minValue = parseFloat(filters.filterMinCotaLida);
      result = result.filter(item => {
        const value = parseFloat(String(item.cota_lida));
        return !isNaN(value) && value >= minValue;
      });
    }
    
    if (filters.filterMaxCotaLida) {
      const maxValue = parseFloat(filters.filterMaxCotaLida);
      result = result.filter(item => {
        const value = parseFloat(String(item.cota_lida));
        return !isNaN(value) && value <= maxValue;
      });
    }
    
    if (filters.filterMinEnchimento) {
      const minValue = parseFloat(filters.filterMinEnchimento);
      result = result.filter(item => {
        const value = parseFloat(String(item.enchimento));
        return !isNaN(value) && value >= minValue;
      });
    }
    
    if (filters.filterMaxEnchimento) {
      const maxValue = parseFloat(filters.filterMaxEnchimento);
      result = result.filter(item => {
        const value = parseFloat(String(item.enchimento));
        return !isNaN(value) && value <= maxValue;
      });
    }
    
    if (filters.filterMinVolumeUtil) {
      const minValue = parseFloat(filters.filterMinVolumeUtil);
      result = result.filter(item => {
        const value = parseFloat(String(item.volume_util));
        return !isNaN(value) && value >= minValue;
      });
    }
    
    if (filters.filterMaxVolumeUtil) {
      const maxValue = parseFloat(filters.filterMaxVolumeUtil);
      result = result.filter(item => {
        const value = parseFloat(String(item.volume_util));
        return !isNaN(value) && value <= maxValue;
      });
    }
    
    if (filters.sortField) {
      result.sort((a, b) => {
        const fieldA = a[filters.sortField];
        const fieldB = b[filters.sortField];
        
        if (fieldA === undefined || fieldA === null) return 1;
        if (fieldB === undefined || fieldB === null) return -1;
        
        const comparison = 
          typeof fieldA === 'string' && typeof fieldB === 'string' 
            ? fieldA.localeCompare(fieldB)
            : Number(fieldA) - Number(fieldB);
            
        return filters.sortDirection === 'highest' ? -comparison : comparison;
      });
    }
    
    return result;
  }, [damDataResponse, filters]);

  if (isInitialLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12">
      <LoadingSpinner />
    </div>
  );
  
  if (error) return <AlertMessage type="error" message={error instanceof Error ? error.message : "An error occurred"} />;
  if (!damDataResponse || !damDataResponse.data || damDataResponse.data.length === 0) 
    return <AlertMessage type="warning" message="No dam data available. Please check your connection or try again later." />;

  const isFallbackSource = damDataResponse.source === "excel_fallback";
  
  const pageSize1 = 5;
  const pageSize2 = 15;

  const startIndex1 = (currentPage - 1) * pageSize1;
  const endIndex1 = startIndex1 + pageSize1;
  const currentRecords1 = filteredData.slice(startIndex1, endIndex1);
  const totalPages1 = Math.ceil(filteredData.length / pageSize1);

  const startIndex2 = (currentPage - 1) * pageSize2;
  const endIndex2 = startIndex2 + pageSize2;
  const totalPages2 = Math.ceil(filteredData.length / pageSize2);

  return (
    <div className="container mx-auto max-h-[100%]">
      <DataSource 
        position="header"
        textKey="dam.dataSource"
        linkKey="dam.sir"
        linkUrl="https://sir.dgadr.gov.pt/outras/reserva-de-agua-nas-albufeiras"
      />
      
      {isFallbackSource && (
        <AlertMessage type="warning" message={t('dam.fetchingError')} /> 
      )}
      
      {/* Mobile View */}
      <div className="block lg:hidden">
        <MobileFilters 
          filters={filters} 
          setFilters={setFilters} 
          onReset={handleResetFilters} 
        />
        
        <div id="dam-cards" className="mt-4">
          {filteredData && filteredData.length > 0 ? (
            currentRecords1.map((barragem, index) => {
              return (
                <TableCard
                  key={`${barragem.barragem} + ${barragem._time}`}
                  id={startIndex1 + index + 1}
                  data={barragem}
                />
              );
            })
          ) : (
            <AlertMessage type="info" message={t('dam.noFilteredResults')} />
          )}

          <div className="mt-6 mb-6">
            <PageController
              currentPage={currentPage}
              totalPages={totalPages1}
              onPageChange={setCurrentPage}          
            />
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <DamMonitoringTable 
          data={filteredData}
          filters={filters}
          setFilters={setFilters}
          currentPage={currentPage}
          startIndex={startIndex2}
          endIndex={endIndex2}
          totalPages={totalPages2}
          setCurrentPage={setCurrentPage}
          onSort={handleSort}
          onResetFilters={handleResetFilters}
        />
      </div>
    </div>
  );
}
