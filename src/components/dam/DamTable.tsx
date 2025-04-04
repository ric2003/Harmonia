"use client"
import React from 'react';
import { DamFilters } from './DamFilters';
import { Table } from '@/components/ui/Table';

interface DamData {
  barragem?: string;
  _time?: string;
  cota_lida?: number;
  enchimento?: number;
  volume_total?: number;
  volume_util?: number;
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

interface DamMonitoringTableProps {
  data: DamData[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onSort: (field: string) => void;
  onResetFilters: () => void;
}

export function DamMonitoringTable({ 
  data,
  filters,
  setFilters,
  currentPage,
  setCurrentPage,
  onSort,
  onResetFilters
}: DamMonitoringTableProps) {
  const columns = [
    {
      key: 'barragem' as keyof DamData,
      header: 'Dam',
      sortable: true,
      width: '200px',
      render: (value: DamData[keyof DamData]) => {
        return typeof value === 'string' ? value : 'N/A';
      }
    },
    {
      key: '_time' as keyof DamData,
      header: 'Date',
      sortable: true,
      width: '120px',
      render: (value: DamData[keyof DamData]) => {
        return typeof value === 'string' ? new Date(value).toLocaleDateString('en-GB') : 'N/A';
      }
    },
    {
      key: 'cota_lida' as keyof DamData,
      header: 'Cota Lida',
      sortable: true,
      width: '120px',
      render: (value: DamData[keyof DamData]) => {
        return typeof value === 'number' ? value.toFixed(2) : 'N/A';
      }
    },
    {
      key: 'enchimento' as keyof DamData,
      header: 'Enchimento',
      sortable: true,
      width: '150px',
      render: (value: DamData[keyof DamData]) => {
        if (typeof value !== 'number') return 'N/A';
        
        const enchimentoPercentage = Math.min(value * 100, 100);

        const getBarColor = (percentage: number) => {
          if (percentage > 70) return "bg-green-500";
          if (percentage > 40) return "bg-yellow-500";
          if (percentage > 20) return "bg-orange-500";
          return "bg-red-500";
        };

        return (
          <div className="flex items-center justify-center">
            <span className="text-darkGray mr-1.5">{(value * 100).toFixed(0)+'%'}</span>
            <div className="w-10 bg-lightGray rounded-full h-1.5">
              <div 
                className={`${getBarColor(enchimentoPercentage)} h-1.5 rounded-full`}
                style={{ width: `${enchimentoPercentage}%` }}
              ></div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'volume_total' as keyof DamData,
      header: 'Volume Total',
      sortable: true,
      width: '120px',
      render: (value: DamData[keyof DamData]) => {
        return typeof value === 'number' ? value.toFixed(2) : 'N/A';
      }
    },
    {
      key: 'volume_util' as keyof DamData,
      header: 'Volume Util',
      sortable: true,
      width: '120px',
      render: (value: DamData[keyof DamData]) => {
        return typeof value === 'number' ? value.toFixed(2) : 'N/A';
      }
    }
  ];

  // Apply filters to the data
  const filteredData = data.filter(item => {
    // Filter by dam name
    if (filters.filterDam && item.barragem?.toLowerCase().indexOf(filters.filterDam.toLowerCase()) === -1) {
      return false;
    }
    
    // Filter by date range
    if (filters.filterStartDate && item._time && new Date(item._time) < new Date(filters.filterStartDate)) {
      return false;
    }
    if (filters.filterEndDate && item._time && new Date(item._time) > new Date(filters.filterEndDate)) {
      return false;
    }
    
    // Filter by volume total
    if (filters.filterMinVolume && item.volume_total !== undefined && item.volume_total < Number(filters.filterMinVolume)) {
      return false;
    }
    if (filters.filterMaxVolume && item.volume_total !== undefined && item.volume_total > Number(filters.filterMaxVolume)) {
      return false;
    }
    
    // Filter by cota lida
    if (filters.filterMinCotaLida && item.cota_lida !== undefined && item.cota_lida < Number(filters.filterMinCotaLida)) {
      return false;
    }
    if (filters.filterMaxCotaLida && item.cota_lida !== undefined && item.cota_lida > Number(filters.filterMaxCotaLida)) {
      return false;
    }
    
    // Filter by enchimento
    if (filters.filterMinEnchimento && item.enchimento !== undefined && item.enchimento < Number(filters.filterMinEnchimento)) {
      return false;
    }
    if (filters.filterMaxEnchimento && item.enchimento !== undefined && item.enchimento > Number(filters.filterMaxEnchimento)) {
      return false;
    }
    
    // Filter by volume util
    if (filters.filterMinVolumeUtil && item.volume_util !== undefined && item.volume_util < Number(filters.filterMinVolumeUtil)) {
      return false;
    }
    if (filters.filterMaxVolumeUtil && item.volume_util !== undefined && item.volume_util > Number(filters.filterMaxVolumeUtil)) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="bg-background rounded-lg max-h-[100%] shadow-lg overflow-hidden">
      <DamFilters 
        filters={filters}
        setFilters={setFilters}
        onReset={onResetFilters}
      />
      <Table
        data={filteredData}
        columns={columns}
        currentPage={currentPage}
        pageSize={15}
        sortField={filters.sortField as keyof DamData || undefined}
        sortDirection={filters.sortDirection}
        onSort={onSort}
        onPageChange={setCurrentPage}
        onResetFilters={onResetFilters}
        emptyMessage="No records match your filter criteria."
      />
    </div>
  );
}