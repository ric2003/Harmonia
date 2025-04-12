"use client"
import { useState } from "react";
import { DamMonitoringTable } from "@/components/dam/DamTable";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertMessage } from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import DataSourceFooter from "@/components/DataSourceFooter";
import { useDamData } from "@/hooks/useDamData";

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
  const { data, isLoading, error } = useDamData();
  
  useTranslatedPageTitle('title.damMonitoring');

  if (isLoading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error instanceof Error ? error.message : "An error occurred"} />;
  if (!data || data.length === 0) return <AlertMessage type="warning" message="No dam data available. Please check your connection or try again later." />;

  return (
    <div className="container mx-auto max-h-[100%]">
      <DamMonitoringTable 
        data={data}
        filters={filters}
        setFilters={setFilters}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onSort={(field) => {
          setFilters(prev => ({
            ...prev,
            sortField: field,
            sortDirection: field === prev.sortField && prev.sortDirection === "highest" ? "lowest" : "highest"
          }));
        }}
        onResetFilters={() => {
          setFilters(initialFilterState);
          setCurrentPage(1);
        }}
      />
      
      <DataSourceFooter 
        textKey="dam.dataSource"
        linkKey="dam.sir"
        linkUrl="https://sir.dgadr.gov.pt/outras/reserva-de-agua-nas-albufeiras"
      />
    </div>
  );
}
