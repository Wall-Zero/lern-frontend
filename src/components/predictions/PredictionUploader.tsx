import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Papa, { ParseResult, ParseError } from 'papaparse';
import { Button } from '../common/Button';
import { ColumnValidationMatrix } from './ColumnValidationMatrix';
import type { ValidationResult } from '../../types/predictions.types';

interface PredictionUploaderProps {
  requiredColumns: string[];
  onFileValidated: (file: File, data: any[], validation: ValidationResult) => void;
  onPredict: () => void;
  isPredicting: boolean;
}

export const PredictionUploader = ({ 
  requiredColumns, 
  onFileValidated, 
  onPredict,
  isPredicting 
}: PredictionUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateColumns = (columns: string[]): ValidationResult => {
    const required = requiredColumns;
    const provided = columns;
    const missing = required.filter(col => !provided.includes(col));
    const extra = provided.filter(col => !required.includes(col));
    
    return {
      required,
      missing,
      extra,
      isValid: missing.length === 0
    };
  };


    const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);

    Papa.parse(selectedFile, {
        header: true,
        preview: 5,
        complete: (results: ParseResult<any>) => {
        const columns = results.meta.fields || [];
        const validationResult = validateColumns(columns);

        setValidation(validationResult);
        setParsedData(results.data);

        onFileValidated(selectedFile, results.data, validationResult);
        },
        error: (error: ParseError) => {
        console.error('Error parsing CSV:', error);
        },
    });
    }, [requiredColumns, onFileValidated, validateColumns]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }, [handleFile]);

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      {!file && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop your CSV file here
          </p>
          <p className="text-sm text-gray-600 mb-4">or</p>
          <label className="cursor-pointer">
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block">
              Browse Files
            </span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </motion.div>
      )}

      {/* File Info & Validation */}
      {file && validation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* File Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024).toFixed(2)} KB • {parsedData.length} rows preview
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setValidation(null);
                setParsedData([]);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Validation Matrix */}
          <ColumnValidationMatrix validation={validation} />

          {/* Data Preview */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">Data Preview (first 5 rows)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(parsedData[0] || {}).slice(0, 5).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                    {Object.keys(parsedData[0] || {}).length > 5 && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                        ... +{Object.keys(parsedData[0] || {}).length - 5} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).slice(0, 5).map((value: any, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {String(value).slice(0, 30)}
                          {String(value).length > 30 && '...'}
                        </td>
                      ))}
                      {Object.keys(row).length > 5 && (
                        <td className="px-6 py-4 text-sm text-gray-500">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Predict Button */}
          <div className="flex items-center justify-between">
            <div>
              {!validation.isValid && (
                <p className="text-sm text-yellow-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Missing columns will use default values
                </p>
              )}
            </div>
            <Button onClick={onPredict} isLoading={isPredicting}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isPredicting ? 'Generating Predictions...' : 'Generate Predictions'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};