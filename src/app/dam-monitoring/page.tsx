"use client"
import { useState } from "react";
import { DamMonitoringTable } from "@/components/dam/DamTable";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertMessage } from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import DataSourceFooter from "@/components/DataSourceFooter";
import { useDamData } from "@/hooks/useDamData";
import TableCard from "@/components/dam/TableCard";
import PageController from "@/components/dam/PageController";

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

  const pageSize1 = 5;
  const pageSize2 = 15;

  const startIndex1 = (currentPage - 1) * pageSize1;
  const endIndex1 = startIndex1 + pageSize1;
  const currentRecords1 = data.slice(startIndex1, endIndex1);
  const totalPages1 = Math.ceil(data.length / pageSize1);

  const startIndex2 = (currentPage - 1) * pageSize2;
  const endIndex2 = startIndex2 + pageSize2;
  const totalPages2 = Math.ceil(data.length / pageSize2);

  return (
    <div className="container mx-auto max-h-[100%]">
      <div className="block lg:hidden">
        {data && data.length > 0 && (
          currentRecords1.map((barragem, index) => {
            return (
              <TableCard
                key={`${barragem.barragem} + ${barragem._time}`}
                id={startIndex1 + index + 1}
                data={barragem}
              />
            );
          })
        )}

        <PageController
          currentPage={currentPage}
          totalPages={totalPages1}
          onPageChange={setCurrentPage}          
        />
      </div>

      <div className="hidden lg:block">
        <DamMonitoringTable 
          data={data}
          filters={filters}
          setFilters={setFilters}
          currentPage={currentPage}
          startIndex={startIndex2}
          endIndex={endIndex2}
          totalPages={totalPages2}
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
      </div>
      
      <DataSourceFooter 
        textKey="dam.dataSource"
        linkKey="dam.sir"
        linkUrl="https://sir.dgadr.gov.pt/outras/reserva-de-agua-nas-albufeiras"
      />
    </div>
  );
}
