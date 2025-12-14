import React, { useState, useEffect } from 'react';
import { ProjectType, PROJECT_LABELS, ComparisonResult } from '../types';
import OCRUploader from './OCRUploader';
import { parseNumbersFromText } from '../utils/ocrUtils';
import { 
  CalculatorIcon, 
  BeakerIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

const PROJECTS: ProjectType[] = ['so2', 'no2', 'flow_rate', 'temperature', 'oxygen', 'humidity', 'particles', 'other_gas', 'average_calc'];

const ComparisonTool: React.FC = () => {
  const [project, setProject] = useState<ProjectType>('so2');
  const [onlineValues, setOnlineValues] = useState<string[]>(['', '', '', '', '']);
  const [bulkText, setBulkText] = useState('');
  const [personalValue, setPersonalValue] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const isAvgMode = project === 'average_calc';

  const handleOnlineChange = (index: number, val: string) => {
    const newVals = [...onlineValues];
    newVals[index] = val;
    setOnlineValues(newVals);
  };

  const handleOCRResult = (nums: number[]) => {
    if (nums.length > 0) {
      setBulkText(prev => {
        const existing = prev ? prev + '\n' : '';
        return existing + nums.join('\n');
      });
    }
  };

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine specific inputs and bulk text
    const specificNums = onlineValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const bulkNums = parseNumbersFromText(bulkText);
    const allOnline = [...specificNums, ...bulkNums];

    if (allOnline.length === 0) {
      alert("请输入至少一个数值");
      return;
    }

    const onlineAverage = allOnline.reduce((a, b) => a + b, 0) / allOnline.length;

    // Special logic for Average Calculation Mode
    if (isAvgMode) {
      setResult({
        onlineAverage,
        personalValue: 0, // Not used
        error: 0,         // Not used
        isRelative: false,// Not used
        isQualified: true,// Always true for display purposes
        message: '纯计算模式',
        documentReq: '',
        sampleCount: allOnline.length
      });
      return;
    }
    
    // Standard Comparison Logic
    const pVal = parseFloat(personalValue);
    if (isNaN(pVal)) {
      alert("请输入有效的本人测量值");
      return;
    }

    let allowableErrorPercentage = 0;
    let allowableError = 0;
    let isRelativeError = false;
    let message = '';
    let documentReq = '';

    const ref = pVal;

    if (project === 'so2') {
      if (ref >= 715) { allowableErrorPercentage = 15; isRelativeError = true; message = '浓度 ≥ 715mg/m³'; documentReq = '相对误差 ≤ 15%'; }
      else if (ref >= 143) { allowableError = 57; message = '143 ≤ 浓度 < 715'; documentReq = '绝对误差 ≤ ±57mg/m³'; }
      else if (ref >= 57) { allowableErrorPercentage = 30; isRelativeError = true; message = '57 ≤ 浓度 < 143'; documentReq = '相对误差 ≤ ±30%'; }
      else { allowableError = 17; message = '浓度 < 57mg/m³'; documentReq = '绝对误差 ≤ ±17mg/m³'; }
    } else if (project === 'no2') {
      if (ref >= 513) { allowableErrorPercentage = 15; isRelativeError = true; message = '浓度 ≥ 513mg/m³'; documentReq = '相对误差 ≤ 15%'; }
      else if (ref >= 103) { allowableError = 41; message = '103 ≤ 浓度 < 513'; documentReq = '绝对误差 ≤ ±41mg/m³'; }
      else if (ref >= 41) { allowableErrorPercentage = 30; isRelativeError = true; message = '41 ≤ 浓度 < 103'; documentReq = '相对误差 ≤ ±30%'; }
      else { allowableError = 12; message = '浓度 < 41mg/m³'; documentReq = '绝对误差 ≤ ±12mg/m³'; }
    } else if (project === 'flow_rate') {
      if (ref > 10) { allowableErrorPercentage = 10; isRelativeError = true; message = '流速 > 10m/s'; documentReq = '相对误差 ≤ 10%'; }
      else { allowableErrorPercentage = 12; isRelativeError = true; message = '流速 ≤ 10m/s'; documentReq = '相对误差 ≤ 12%'; }
    } else if (project === 'temperature') {
      allowableError = 3; message = '全量程'; documentReq = '绝对误差 ≤ ±3°C';
    } else if (project === 'oxygen') {
      if (ref > 5.0) { allowableErrorPercentage = 15; isRelativeError = true; message = '含氧量 > 5%'; documentReq = '相对误差 ≤ 15%'; }
      else { allowableError = 1.0; message = '含氧量 ≤ 5%'; documentReq = '绝对误差 ≤ ±1.0%'; }
    } else if (project === 'humidity') {
      if (ref > 5.0) { allowableErrorPercentage = 25; isRelativeError = true; message = '含湿量 > 5%'; documentReq = '相对误差 ≤ 25%'; }
      else { allowableError = 1.5; message = '含湿量 ≤ 5%'; documentReq = '绝对误差 ≤ ±1.5%'; }
    } else if (project === 'particles') {
      if (ref >= 200) { allowableErrorPercentage = 15; isRelativeError = true; message = '浓度 ≥ 200mg/m³'; documentReq = '相对误差 ≤ 15%'; }
      else if (ref >= 100) { allowableError = 2; message = '100 ≤ 浓度 < 200'; documentReq = '绝对误差 ≤ ±2mg/m³'; }
      else if (ref >= 50) { allowableErrorPercentage = 25; isRelativeError = true; message = '50 ≤ 浓度 < 100'; documentReq = '相对误差 ≤ 25%'; }
      else if (ref >= 20) { allowableErrorPercentage = 30; isRelativeError = true; message = '20 ≤ 浓度 < 50'; documentReq = '相对误差 ≤ 30%'; }
      else { allowableError = 6; message = '浓度 < 20mg/m³'; documentReq = '绝对误差 ≤ ±6mg/m³'; }
    } else if (project === 'other_gas') {
      allowableErrorPercentage = 15; isRelativeError = true; message = '全量程'; documentReq = '相对误差 ≤ 15%';
    }

    if (isRelativeError && pVal === 0) {
      alert("个人测量值为 0，无法计算相对误差");
      return;
    }

    const error = isRelativeError
      ? Math.abs((onlineAverage - pVal) / pVal) * 100
      : Math.abs(onlineAverage - pVal);
    
    const isQualified = isRelativeError ? (error <= allowableErrorPercentage) : (error <= allowableError);

    setResult({
      onlineAverage,
      personalValue: pVal,
      error,
      isRelative: isRelativeError,
      isQualified,
      message,
      documentReq
    });
  };

  // Reset result when project changes
  useEffect(() => { setResult(null); }, [project]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Project Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <BeakerIcon className="w-5 h-5 mr-2 text-brand-600" />
          选择检测项目
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {PROJECTS.map((key) => (
            <button
              key={key}
              onClick={() => setProject(key)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                project === key
                  ? 'bg-brand-500 text-white border-brand-600 shadow-md transform scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {PROJECT_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Inputs */}
        <form onSubmit={calculate} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 border-l-4 border-brand-500 pl-3">
              {isAvgMode ? '数据输入' : '数据输入'}
            </h3>
            
            {/* Inline OCR */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">快速导入 (OCR)</label>
              <OCRUploader onNumbersFound={handleOCRResult} isInline={true} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAvgMode ? '输入数值 (单项)' : '在线测量值 (单项)'}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {onlineValues.map((val, idx) => (
                    <input
                      key={idx}
                      type="number"
                      step="any"
                      placeholder={`${idx + 1}`}
                      value={val}
                      onChange={(e) => handleOnlineChange(idx, e.target.value)}
                      className="w-full px-2 py-1 text-sm border-gray-300 rounded focus:ring-brand-500 focus:border-brand-500 text-center"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAvgMode ? '批量数值输入 / OCR结果' : '批量输入 / OCR结果'}
                </label>
                <textarea
                  rows={4}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="可在此处粘贴或手动输入，支持空格或换行分隔"
                  className="w-full px-3 py-2 border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                />
              </div>

              {!isAvgMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">本人测量值 (基准)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={personalValue}
                    onChange={(e) => setPersonalValue(e.target.value)}
                    className="w-full px-4 py-2 text-lg font-mono border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-brand-50 border-brand-200"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="mt-6 w-full flex justify-center items-center px-4 py-3 bg-brand-600 text-white rounded-lg font-medium shadow hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
            >
              <CalculatorIcon className="w-5 h-5 mr-2" />
              {isAvgMode ? '计算平均数' : '开始比对'}
            </button>
          </div>
        </form>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {result ? (
            isAvgMode ? (
              // Average Calculation Result View
              <div className="p-6 rounded-xl shadow-lg border-2 bg-brand-50 border-brand-200">
                 <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-brand-800 flex items-center">
                    <ListBulletIcon className="w-6 h-6 mr-2" />
                    计算结果
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-brand-200/50 pb-3">
                    <span className="text-brand-700 font-medium">样本数量 (n)</span>
                    <span className="text-2xl font-mono font-bold text-brand-900">{result.sampleCount}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-brand-700 font-medium">算术平均值</span>
                    <span className="text-4xl font-mono font-bold text-brand-600">{result.onlineAverage.toFixed(5)}</span>
                  </div>
                </div>
              </div>
            ) : (
              // Standard Comparison Result View
              <div className={`p-6 rounded-xl shadow-lg border-2 ${result.isQualified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-bold ${result.isQualified ? 'text-green-800' : 'text-red-800'}`}>
                    {result.isQualified ? '比对合格' : '比对不合格'}
                  </h3>
                  {result.isQualified ? (
                    <CheckCircleIcon className="w-10 h-10 text-green-600" />
                  ) : (
                    <XCircleIcon className="w-10 h-10 text-red-600" />
                  )}
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-200/50 pb-2">
                    <span className="text-gray-600">在线平均值</span>
                    <span className="font-mono font-bold text-gray-900">{result.onlineAverage.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200/50 pb-2">
                    <span className="text-gray-600">本人测量值</span>
                    <span className="font-mono font-bold text-gray-900">{result.personalValue.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200/50 pb-2">
                    <span className="text-gray-600">计算误差</span>
                    <span className="font-mono font-bold text-brand-700">
                      {result.error.toFixed(result.isRelative ? 2 : 5)}{result.isRelative ? '%' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200/50 pb-2">
                    <span className="text-gray-600">标准要求</span>
                    <span className="text-gray-900 text-right">{result.documentReq}</span>
                  </div>
                  <div className="mt-4 pt-2">
                    <span className="text-xs text-gray-500 block mb-1">判定依据范围</span>
                    <p className="text-gray-700 font-medium">{result.message}</p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="h-full bg-gray-100 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
              <CalculatorIcon className="w-16 h-16 mb-2 opacity-50" />
              <p>输入数据后点击“{isAvgMode ? '计算平均数' : '开始比对'}”</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonTool;