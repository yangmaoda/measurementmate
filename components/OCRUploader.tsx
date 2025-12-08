import React, { useState, useRef } from 'react';
import { createWorker, parseNumbersFromText, preprocessImage } from '../utils/ocrUtils';
import { ArrowUpTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface OCRUploaderProps {
  onNumbersFound: (nums: number[]) => void;
  onRawText?: (text: string) => void;
  isInline?: boolean;
}

const OCRUploader: React.FC<OCRUploaderProps> = ({ onNumbersFound, onRawText, isInline = false }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setStatus('初始化 OCR 引擎...');

    try {
      const worker = await createWorker((m) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
          setStatus(`识别中... ${Math.round(m.progress * 100)}%`);
        }
      });

      await worker.setParameters({
        tessedit_char_whitelist: '0123456789.,-',
        preserve_interword_spaces: '1',
      });

      let allNums: number[] = [];
      let allText = '';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatus(`正在处理图片 ${i + 1}/${files.length}: ${file.name}`);
        
        const variants = await preprocessImage(file);
        // Use the first variant (scaled original)
        const { data: { text } } = await worker.recognize(variants[0]);
        
        allText += text + '\n';
        const nums = parseNumbersFromText(text);
        allNums = [...allNums, ...nums];
      }

      await worker.terminate();

      if (onRawText) onRawText(allText);
      onNumbersFound(allNums);
      setStatus(`完成! 识别到 ${allNums.length} 个数字。`);
    } catch (err) {
      console.error(err);
      setStatus('识别出错，请重试。');
    } finally {
      setIsProcessing(false);
      setProgress(100);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl transition-colors ${isProcessing ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className={`${isInline ? 'p-4' : 'p-8'} text-center`}>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        {!isProcessing ? (
          <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <PhotoIcon className={`mx-auto text-gray-400 ${isInline ? 'h-8 w-8' : 'h-12 w-12'}`} />
            <p className="mt-2 text-sm text-gray-600 font-medium">
              点击上传或拖拽图片
            </p>
            <p className="text-xs text-gray-400 mt-1">支持多张图片批量识别</p>
          </div>
        ) : (
          <div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 dark:bg-gray-700">
              <div className="bg-brand-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm text-brand-700 font-medium animate-pulse">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRUploader;