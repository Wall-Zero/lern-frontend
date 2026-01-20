import { motion } from 'framer-motion';
import { Badge } from '../common/Badge';

interface DataPreviewProps {
  data: any[];
  requiredColumns: string[];
  fileName: string;
  onRemove: () => void;
}

export const DataPreview = ({ data, requiredColumns, fileName, onRemove }: DataPreviewProps) => {
  // Get columns from data
  const providedColumns = data.length > 0 ? Object.keys(data[0]) : [];
  
  // Validate columns
  const missingColumns = requiredColumns.filter(col => !providedColumns.includes(col));
  const hasAllColumns = missingColumns.length === 0;

  // Get first 10 rows for preview
  const previewData = data.slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* File Info Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{fileName}</h4>
              <p className="text-sm text-gray-600">{data.length} rows • {providedColumns.length} columns</p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Remove file"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Validation Status */}
      <div className={`border rounded-lg p-4 ${
        hasAllColumns 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start gap-3">
          {hasAllColumns ? (
            <>
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 mb-1">✓ Ready to Predict</h4>
                <p className="text-sm text-green-700">
                  All {requiredColumns.length} required features are present in your data
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {data.length} rows will be processed
                </p>
              </div>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-2">Missing Required Columns</h4>
                <p className="text-sm text-red-700 mb-3">
                  Your CSV is missing {missingColumns.length} required column{missingColumns.length > 1 ? 's' : ''}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingColumns.map((col) => (
                    <Badge key={col} variant="error">
                      {col}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-red-700 mt-3">
                  Please update your CSV to include all required columns with exact names.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Data Preview Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h4 className="font-semibold text-gray-900">Data Preview</h4>
          <p className="text-sm text-gray-600">Showing {previewData.length} of {data.length} rows</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                {providedColumns.map((col) => {
                  const isRequired = requiredColumns.includes(col);
                  const isMissing = missingColumns.includes(col);
                  
                  return (
                    <th 
                      key={col} 
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <span className={
                          isMissing ? 'text-red-600' :
                          isRequired ? 'text-green-600' : 
                          'text-gray-500'
                        }>
                          {col}
                        </span>
                        {isRequired && !isMissing && (
                          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {previewData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {idx + 1}
                  </td>
                  {providedColumns.map((col) => (
                    <td key={col} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length > 10 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center">
            + {data.length - 10} more rows
          </div>
        )}
      </div>
    </motion.div>
  );
};