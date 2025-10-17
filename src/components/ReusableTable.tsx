import React, { ReactNode } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import noDataImage from '../assets/noData.svg';

// Define a type for column configuration
interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  isRounded?: 'left' | 'right' | null;
}

interface PaginatedTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  emptyStateMessage: string;
  rowsPerPage: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  renderRow?: (item: T, index: number) => ReactNode;
  onRowClick?: (item: T) => void;
}

const PaginatedTable = <T extends object>({
  data,
  columns,
  emptyStateMessage,
  rowsPerPage,
  currentPage,
  setCurrentPage,
  renderRow,
  onRowClick,
}: PaginatedTableProps<T>) => {
  const totalPages = Math.ceil(data.length / rowsPerPage);
  
  const handlePrevPage = () => {
    setCurrentPage(Math.max(currentPage - 1, 0));
  };
  
  const handleNextPage = () => {
    setCurrentPage(Math.min(currentPage + 1, totalPages - 1));
  };

  const startIndex = currentPage * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  // Helper function to safely render cell content
  const renderCellContent = (item: T, accessor: keyof T | ((item: T) => ReactNode)): ReactNode => {
    if (typeof accessor === 'function') {
      return accessor(item);
    }
    
    const value = item[accessor];
    
    // Handle different types of values appropriately
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (
      typeof value === 'string' || 
      typeof value === 'number' || 
      typeof value === 'boolean'
    ) {
      return String(value);
    }
    
    if (React.isValidElement(value)) {
      return value;
    }
    
    // For objects, arrays, or other complex types, stringify or return placeholder
    return JSON.stringify(value);
  };

  // Check if data is empty
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <img
          src={noDataImage}
          alt="No Data Available"
          className="w-24 h-24 object-contain"
        />
        <p className="text-black text-opacity-50 mt-4">
          {emptyStateMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto flex-grow">
        <table className="min-w-full w-full border-collapse rounded-t-lg font-light">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr className="p-3 text-left text-sm font-normal text-gray-700 border-b border-gray-200">
              {columns.map((column, index) => (
                <th 
                  key={index} 
                  className={`p-3 text-left font-normal ${
                    column.isRounded === 'left' ? 'rounded-tl-lg' : 
                    column.isRounded === 'right' ? 'rounded-tr-lg' : ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderRow 
              ? paginatedData.map((item, index) => renderRow(item, index))
              : paginatedData.map((item, index) => (
                  <tr 
                    key={index} 
                    className={`hover:bg-gray-50 border-b border-gray-100 text-opacity-50 text-sm transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="p-3 align-middle">
                        {renderCellContent(item, column.accessor)}
                      </td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center space-x-4 mt-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className={`p-2 rounded-md ${
              currentPage === 0 ? 'bg-gray-200 text-gray-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MdChevronLeft size={20} />
          </button>
          <p className="text-gray-600 text-sm font-light">
            Page {currentPage + 1} of {totalPages}
          </p>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className={`p-2 rounded-md ${
              currentPage === totalPages - 1
                ? 'bg-gray-200 text-gray-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MdChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PaginatedTable;