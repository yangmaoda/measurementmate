import React, { useState } from 'react';
import OCRUploader from './OCRUploader';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const StandaloneOCR: React.FC = () => {
  const [rawText, setRawText] = useState('');
  const [nums, setNums] = useState<number[]>([]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center">
          <DocumentTextIcon className="w-5 h-5 mr-2 text-brand-600" />
          图片转文字 (OCR)
        </h2>
        <p className="text-sm text-gray-500 mt-1">上传仪器仪表照片，自动提取读数。支持拖拽。</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <OCRUploader 
          onNumbersFound={setNums} 
          onRawText={setRawText} 
        />
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">提取的数字数组</h4>
            {nums.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {nums.map((n, i) => (
                  <span key={i} className="px-2 py-1 bg-brand-100 text-brand-700 rounded font-mono text-sm">
                    {n}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">等待识别...</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">原始文本内容</h4>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-64 font-mono">
              {rawText || '...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandaloneOCR;