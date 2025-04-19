"use client"
import React from 'react';
import { DamFilters } from './DamFilters';
import { Table } from '@/components/ui/Table';
import { useTranslation } from 'react-i18next';

export interface DamData {
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
  startIndex: number;
  endIndex: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  onSort: (field: string) => void;
  onResetFilters: () => void;
}

export function DamMonitoringTable({
  data,
  filters,
  setFilters,
  currentPage,
  startIndex,
  endIndex,
  totalPages,
  setCurrentPage,
  onSort,
  onResetFilters
}: DamMonitoringTableProps) {
  const { t } = useTranslation();
  const columns = [
    {
      key: 'barragem' as keyof DamData,
      header: t('dam.table.dam'),
      sortable: true,
      width: '200px',
      render: (value: DamData[keyof DamData]) => {
        return typeof value === 'string' ? value : 'N/A';
      }
    },
    {
      key: '_time' as keyof DamData,
      header: t('dam.table.date'),
      sortable: true,
      width: '120px',
      render: (value: DamData[keyof DamData]) => {
        return typeof value === 'string' ? new Date(value).toLocaleDateString('en-GB') : 'N/A';
      }
    },
    {
      key: 'cota_lida' as keyof DamData,
      header: t('dam.table.cotaLida'),
      sortable: true,
      width: '120px',
      render: (value: DamData[keyof DamData]) => {
        return typeof value === 'number' ? value.toFixed(2) : 'N/A';
      }
    },
    {
      key: 'enchimento' as keyof DamData,
      header: t('dam.table.enchimento'),
      sortable: true,
      width: '150px',
      render: (value: DamData[keyof DamData]) => {
        if (typeof value !== 'number') return 'N/A';

        const enchimentoPercentage = Math.min(value * 100, 100);

        const getBarColor = (percentage: number) => {
          if (percentage > 70) return 'bg-gradient-to-r from-green-500 to-green-400';
          if (percentage > 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
          if (percentage > 20) return 'bg-gradient-to-r from-orange-500 to-orange-400';
          return 'bg-gradient-to-r from-red-500 to-red-400';
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
      header: t('dam.table.volumeTotal'),
      sortable: true,
      width: '120px',
      render: (value: DamData[keyof DamData]) => {
        return typeof value === 'number' ? value.toFixed(2) : 'N/A';
      }
    },
    {
      key: 'volume_util' as keyof DamData,
      header: t('dam.table.volumeUtil'),
      sortable: true,
      width: '120px',
      render: (value: DamData[keyof DamData]) => {
        return typeof value === 'number' ? value.toFixed(2) : 'N/A';
      }
    }
  ];

  // Note: Filtering is now handled in the parent page component
  // The data prop already contains filtered data

  return (
    <div className="bg-background rounded-lg max-h-[100%] shadow-lg overflow-hidden">
      <DamFilters
        filters={filters}
        setFilters={setFilters}
        onReset={onResetFilters}
      />
      <Table
        data={data}
        columns={columns}
        currentPage={currentPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalPages={totalPages}
        sortField={filters.sortField as keyof DamData || undefined}
        sortDirection={filters.sortDirection}
        onSort={onSort}
        onPageChange={setCurrentPage}
        onResetFilters={onResetFilters}
        emptyMessage={t('dam.table.noRecords')}
      />
    </div>
  );
}