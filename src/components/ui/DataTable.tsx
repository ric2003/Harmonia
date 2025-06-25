import { useCallback, useMemo, ReactNode, useState, useEffect } from 'react';

interface Column {
  key: string;
  header: string;
  render?: (value: unknown, row?: unknown) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column[];
  currentPage: number;
  onPageChange: (page: number) => void;
  rowsPerPage?: number;
  mobileCardRenderer?: (item: T) => ReactNode;
}

export function DataTable<T>({ 
  data, 
  columns, 
  currentPage, 
  onPageChange, 
  rowsPerPage = 10,
  mobileCardRenderer,
}: DataTableProps<T>) {
  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate pagination values
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / rowsPerPage);
  }, [data.length, rowsPerPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return data.slice(startIndex, startIndex + rowsPerPage);
  }, [data, currentPage, rowsPerPage]);

  const handlePageChange = useCallback((page: number) => {
    onPageChange(page);
  }, [onPageChange]);

  const renderCell = (item: T, column: Column): ReactNode => {
    const value = item[column.key as keyof T];
    
    // Handle date formatting for columns with date values
    if (column.key === '_time' || column.key === 'date') {
      const dateStr = String(value);
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return `${date.toLocaleDateString('en-GB')}`;
        }
      }
    }
    
    return column.render ? column.render(value, item) : String(value);
  };

  return (
    <>
      {/* Mobile view: Cards */}
      {mobileCardRenderer && (
        <div className="block sm:hidden space-y-3 -mx-4 px-4">
          {paginatedData.map((item, index) => (
            <div key={index}>
              {mobileCardRenderer(item)}
            </div>
          ))}
        </div>
      )}
      
      {/* Desktop view: Table */}
      <div className={'hidden sm:block overflow-x-auto rounded-lg border border-gray200'}>
        <table className="min-w-full divide-y divide-gray100">
          <thead>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-bold text-gray700 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="glass-transparent divide-y divide-gray200">
            {paginatedData.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray100">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray700">
                    {renderCell(item, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <nav className={'flex items-center space-x-1 glass-panel-visible rounded-lg p-2'}>
            {/* First page button */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`px-2 sm:px-3 py-1 rounded-md transition-all ${
                currentPage === 1 
                  ? 'text-gray500 cursor-not-allowed' 
                  : 'text-gray700 hover:glass-panel hover:text-primary'
              }`}
              title="First page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Previous page button */}
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-2 sm:px-3 py-1 rounded-md transition-all ${
                currentPage === 1 
                  ? 'text-gray200 cursor-not-allowed' 
                  : 'text-gray700 hover:glass-panel hover:text-primary'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
              // Responsive page count: 3 on mobile, 5 on desktop
              const maxPages = isMobile ? 3 : 5;
              const halfPages = Math.floor(maxPages / 2);
              
              // Show pages around current page
              let pageNum;
              if (totalPages <= maxPages) {
                // If fewer pages than max, show all
                pageNum = i + 1;
              } else if (currentPage <= halfPages + 1) {
                // If near start, show first pages
                pageNum = i + 1;
              } else if (currentPage >= totalPages - halfPages) {
                // If near end, show last pages
                pageNum = totalPages - maxPages + 1 + i;
              } else {
                // Otherwise show pages around current page
                pageNum = currentPage - halfPages + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-2 sm:px-3 py-1 rounded-md transition-all text-sm ${
                    currentPage === pageNum
                      ? 'glass-panel text-primary font-semibold'
                      : 'text-gray700 hover:glass-panel hover:text-primary'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {/* Next page button */}
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-2 sm:px-3 py-1 rounded-md transition-all ${
                currentPage === totalPages
                  ? 'text-gray200 cursor-not-allowed'
                  : 'text-gray700 hover:glass-panel hover:text-primary'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Last page button */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-2 sm:px-3 py-1 rounded-md transition-all ${
                currentPage === totalPages
                  ? 'text-gray200 cursor-not-allowed'
                  : 'text-gray700 hover:glass-panel hover:text-primary'
              }`}
              title="Last page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7m-8-14l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </>
  );
}