import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '../common/Button';

interface GeneratedCodeViewProps {
  code: string;
  generatedAt: string;
}

export const GeneratedCodeView = ({ code, generatedAt }: GeneratedCodeViewProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Generated Training Code</h3>
          <p className="text-sm text-gray-600">Generated {formatDate(generatedAt)}</p>
        </div>
        <Button variant="secondary" onClick={handleCopy} className="text-sm">
          {copied ? (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Code
            </>
          )}
        </Button>
      </div>
      <div className="relative">
        <pre className="p-6 text-sm overflow-x-auto bg-gray-900 text-gray-100" style={{ maxHeight: '500px' }}>
          <code>{code}</code>
        </pre>
      </div>
    </motion.div>
  );
};