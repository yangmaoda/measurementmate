import React, { useState } from 'react';
import { ArrowsRightLeftIcon, CalculatorIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';

interface HistoryItem {
  id: number;
  timestamp: string;
  type: 'gas' | 'rounding';
  title: string;
  inputDetails: string;
  resultDetails: string;
}

const ConversionTool: React.FC = () => {
  // Gas Conversion State
  const [stdOxygen, setStdOxygen] = useState('');
  const [measOxygen, setMeasOxygen] = useState('');
  const [measValue, setMeasValue] = useState('');
  const [conversionResult, setConversionResult] = useState<{ input: number; result: number }[]>([]);

  // Rounding State
  const [roundInput, setRoundInput] = useState('');
  const [roundResult, setRoundResult] = useState<number | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const deleteHistoryItem = (id: number) => {
    setHistory(history.filter(item => item.id !== id));
  };

  const handleConversion = (e: React.FormEvent) => {
    e.preventDefault();
    const std = parseFloat(stdOxygen);
    const o2Arr = measOxygen.split(/[\/\s,]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    const valArr = measValue.split(/[\/\s,]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

    if (isNaN(std)) { alert("请输入有效的基准氧"); return; }
    if (o2Arr.length === 0 || valArr.length === 0) { alert("请输入实测数据"); return; }
    if (o2Arr.length !== valArr.length) { alert("实测氧含量数量与实测数值数量不匹配"); return; }

    const results = o2Arr.map((o2, idx) => {
      if (21 - o2 === 0) return { input: valArr[idx], result: 0 }; // Avoid division by zero
      const res = (21 - std) / (21 - o2) * valArr[idx];
      return { input: valArr[idx], result: res };
    });
    setConversionResult(results);

    // Save History
    const trunc = (arr: any[]) => {
      const s = arr.join(', ');
      return s.length > 20 ? s.substring(0, 20) + '...' : s;
    };
    
    const newItem: HistoryItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'gas',
      title: '烟气折算',
      inputDetails: `基准O₂:${std}%, 实测O₂:[${trunc(o2Arr)}], 值:[${trunc(valArr)}]`,
      resultDetails: `结果:[${trunc(results.map(r => r.result.toFixed(2)))}]`
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const roundHalfToEven = (value: number) => {
    const decimal = value % 1;
    if (Math.abs(decimal) === 0.5) {
      const integerPart = Math.floor(Math.abs(value));
      return (integerPart % 2 === 0) ? Math.trunc(value) : Math.round(value);
    }
    return Math.round(value);
  };

  const handleRounding = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(roundInput);
    if (!isNaN(val)) {
      const res = roundHalfToEven(val);
      setRoundResult(res);

      // Save History
      const newItem: HistoryItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'rounding',
        title: '数值修约',
        inputDetails: `输入: ${val}`,
        resultDetails: `结果: ${res}`
      };
      setHistory(prev => [newItem, ...prev]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gas Conversion Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
            <ArrowsRightLeftIcon className="w-5 h-5 mr-2 text-brand-600" />
            烟气折算计算
          </h3>
          <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
            公式: (21 - 基准氧) / (21 - 实测氧) × 实测数值
          </p>
          <form onSubmit={handleConversion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">基准氧含量 (%)</label>
              <input
                type="number"
                step="any"
                required
                value={stdOxygen}
                onChange={e => setStdOxygen(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">实测氧含量 (%) <span className="text-xs text-gray-400 font-normal">用 / 或空格分隔</span></label>
              <input
                type="text"
                required
                placeholder="e.g. 6.1 / 6.2"
                value={measOxygen}
                onChange={e => setMeasOxygen(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">实测数值 <span className="text-xs text-gray-400 font-normal">用 / 或空格分隔</span></label>
              <input
                type="text"
                required
                placeholder="e.g. 100 / 102"
                value={measValue}
                onChange={e => setMeasValue(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700">计算折算值</button>
          </form>

          {conversionResult.length > 0 && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-sm text-gray-700 mb-2">计算结果:</h4>
              <ul className="space-y-1 text-sm">
                {conversionResult.map((r, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="text-gray-500">#{i + 1} (原始: {r.input})</span>
                    <span className="font-bold text-brand-700">{r.result.toFixed(4)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Rounding Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
            <CalculatorIcon className="w-5 h-5 mr-2 text-brand-600" />
            修约计算器
          </h3>
          <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
            规则: 四舍六入五成双
          </p>
          <form onSubmit={handleRounding} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">输入数值</label>
              <input
                type="number"
                step="any"
                required
                value={roundInput}
                onChange={e => setRoundInput(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700">进行修约</button>
          </form>

          {roundResult !== null && (
            <div className="mt-6 text-center">
              <span className="block text-sm text-gray-500">修约结果</span>
              <span className="block text-4xl font-bold text-gray-800 mt-1">{roundResult}</span>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="border-t border-gray-200 pt-8 mt-8">
          <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-gray-500" />
            历史计算记录
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative group hover:shadow-md transition-shadow">
                <button 
                  onClick={() => deleteHistoryItem(item.id)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除记录"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${item.type === 'gas' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                    {item.title}
                  </span>
                  <span className="text-xs text-gray-400">{item.timestamp}</span>
                </div>
                
                <div className="mb-2">
                   <div className="text-sm font-mono font-bold text-gray-800 break-all">{item.resultDetails}</div>
                </div>

                <div className="pt-2 border-t border-gray-100 text-xs text-gray-400 break-all">
                  {item.inputDetails}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionTool;