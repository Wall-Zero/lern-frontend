interface ColumnSearchProps {
  value: string;
  onChange: (value: string) => void;
  totalColumns: number;
  filteredCount: number;
}

export const ColumnSearch = ({ value, onChange, totalColumns, filteredCount }: ColumnSearchProps) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex-1 relative">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search columns..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      {value && (
        <div className="text-sm text-gray-600">
          Showing {filteredCount} of {totalColumns} columns
        </div>
      )}
    </div>
  );
};