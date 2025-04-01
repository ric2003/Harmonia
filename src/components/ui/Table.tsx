import React from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  currentPage: number;
  pageSize: number;
  sortField?: keyof T;
  sortDirection?: 'lowest' | 'highest';
  onSort?: (field: keyof T) => void;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
  onResetFilters?: () => void;
}

export function Table<T>({
  data,
  columns,
  currentPage,
  pageSize,
  sortField,
  sortDirection,
  onSort,
  onPageChange,
  emptyMessage = "No records found",
  onResetFilters
}: TableProps<T>) {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRecords = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / pageSize);

  return (
    <div className="bg-background shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray100 text-left text-darkGray">
              <th className="pl-4 py-2 text-[10px] font-semibold uppercase tracking-wider w-14">#</th>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`py-2 text-[10px] font-semibold uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray200' : ''
                  } ${column.align === 'right' ? 'text-right' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center justify-center">
                    {column.header}
                    {column.sortable && (
                      <>
                        {sortField === column.key ? (
                          <span className="ml-1">
                            {sortDirection === "lowest" ? "↓" : "↑"}
                          </span>
                        ) : (
                          <span className="ml-1 text-gray400">↕</span>
                        )}
                      </>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-lightGray">
            {currentRecords.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray50" : "bg-backgroundColor"}>
                <td className="pl-4 py-2 w-12 text-xs text-darkGray">{startIndex + index + 1}</td>
                {columns.map((column) => (
                  <td 
                    key={String(column.key)} 
                    className="py-2 text-xs text-darkGray"
                    style={{ width: column.width }}
                  >
                    <div className={`flex justify-${column.align || 'center'}`}>
                      {column.render
                        ? column.render(item[column.key], item)
                        : (item[column.key]?.toString() || 'N/A')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="p-6 text-center">
          <p className="text-xs text-gray600">{emptyMessage}</p>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="mt-1.5 text-xs text-primary hover:text-opacity-80 font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* Pagination controls */}
      <div className="bg-backgroundColor px-4 py-3 border-t border-lightGray flex items-center justify-between">
        <div className="text-xs text-gray600">
          {data.length > 0 ? (
            <>
              Showing (<span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, data.length)}</span>) of{' '}
              <span className="font-medium">{data.length}</span> results
            </>
          ) : (
            <span>No results to display</span>
          )}
        </div>

        {data.length > 0 && (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-lightGray rounded-md text-xs font-medium text-darkGray bg-background hover:bg-gray50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                  onPageChange(page);
                }}
                className="w-14 text-center border border-lightGray rounded-md shadow-sm px-2 py-1.5 text-xs text-darkGray bg-background"
                min={1}
                max={totalPages}
              />
              <span className="ml-1.5 text-gray700 text-xs">of {totalPages}</span>
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 border border-lightGray rounded-md text-xs font-medium text-darkGray bg-background hover:bg-gray50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 