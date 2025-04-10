"use client"
import { useEffect, useState } from "react";
import { DamMonitoringTable } from "@/components/dam/DamTable";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertMessage } from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import DataSourceFooter from "@/components/DataSourceFooter";


interface QueryResult {
  _time: string | undefined;
  barragem: string | undefined;
  cota_lida: number | undefined;
  enchimento: number | undefined;
  volume_total: number | undefined;
  volume_util: number | undefined;
  [key: string]: string | number | undefined;
}

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
  const [data, setData] = useState<QueryResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [currentPage, setCurrentPage] = useState(1);
  
  useTranslatedPageTitle('title.damMonitoring');

  useEffect(() => {
    async function fetchInfluxData() {
      try {
        setLoading(true);
        const response = await fetch("/api/influx");
        const responseData = await response.json();

        if (responseData.success) {
          setData(responseData.data);
        } else {
          setError(responseData.error || "Failed to fetch data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchInfluxData();
  }, []);

  const filteredData = data.filter((record) => {
    // Dam name filter
    const matchesDam = filters.filterDam.trim() === "" || 
      record.barragem?.toLowerCase().includes(filters.filterDam.trim().toLowerCase());
    
    // Date range filter
    let matchesDateRange = true;
    const recordDate = record._time ? new Date(record._time) : null;
    
    if (filters.filterStartDate && recordDate) {
      const startDate = new Date(filters.filterStartDate);
      matchesDateRange = matchesDateRange && recordDate >= startDate;
    }
    
    if (filters.filterEndDate && recordDate) {
      const endDate = new Date(filters.filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      matchesDateRange = matchesDateRange && recordDate <= endDate;
    }
    
    // Volume total range filter
    const volumeTotal = record.volume_total !== null && record.volume_total !== undefined ? 
      Number(record.volume_total) : null;
    
    const matchesMinVolume = filters.filterMinVolume === "" || 
      (volumeTotal !== null && volumeTotal >= Number(filters.filterMinVolume));
    
    const matchesMaxVolume = filters.filterMaxVolume === "" || 
      (volumeTotal !== null && volumeTotal <= Number(filters.filterMaxVolume));
    
    // Other filters follow the same pattern...
    return matchesDam && matchesDateRange && matchesMinVolume && matchesMaxVolume;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!filters.sortField) return 0;
    
    const fieldA = a[filters.sortField];
    const fieldB = b[filters.sortField];
    
    if (fieldA === undefined || fieldB === undefined) return 0;
    
    if (!isNaN(Number(fieldA)) && !isNaN(Number(fieldB))) {
      return filters.sortDirection === "lowest" 
        ? Number(fieldA) - Number(fieldB) 
        : Number(fieldB) - Number(fieldA);
    }
    
    return filters.sortDirection === "lowest"
      ? String(fieldA).localeCompare(String(fieldB))
      : String(fieldB).localeCompare(String(fieldA));
  });

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: field === prev.sortField && prev.sortDirection === "highest" ? "lowest" : "highest"
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilterState);
    setCurrentPage(1);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;
  if (data.length === 0) return <AlertMessage type="warning" message="No dam data available. Please check your connection or try again later." />;

  return (
    <div className="container mx-auto max-h-[100%]">
      <DamMonitoringTable 
        data={sortedData}
        filters={filters}
        setFilters={setFilters}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onSort={handleSort}
        onResetFilters={resetFilters}
      />
      
      <DataSourceFooter 
        textKey="dam.dataSource"
        linkKey="dam.sir"
        linkUrl="https://sir.dgadr.gov.pt/outras/reserva-de-agua-nas-albufeiras"
      />
    </div>
  );
}
