import { useCallback, useMemo, ReactNode } from 'react';

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
  mobileCardRenderer
}: DataTableProps<T>) {
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
      <div className="hidden sm:block overflow-x-auto bg-background rounded-lg shadow">
        <table className="min-w-full divide-y divide-lightGray">
          <thead className="bg-gray50">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray600 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-lightGray">
            {paginatedData.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
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
          <nav className="flex items-center space-x-1">
            {/* First page button */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1 
                  ? 'text-gray400 cursor-not-allowed' 
                  : 'text-primary hover:bg-primary-light'
              }`}
              title="First page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Previous page button */}
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1 
                  ? 'text-gray400 cursor-not-allowed' 
                  : 'text-primary hover:bg-primary-light'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                // If 5 or fewer pages, show all
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                // If near start, show first 5 pages
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // If near end, show last 5 pages
                pageNum = totalPages - 4 + i;
              } else {
                // Otherwise show 2 before and 2 after current page
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === pageNum
                      ? 'bg-primary text-white'
                      : 'text-darkGray hover:bg-gray200'
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
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray400 cursor-not-allowed'
                  : 'text-primary hover:bg-primary-light'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Last page button */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray400 cursor-not-allowed'
                  : 'text-primary hover:bg-primary-light'
              }`}
              title="Last page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7m-8-14l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </>
  );
}