import React, { useState } from 'react';
import { WrenchScrewdriverIcon, ScaleIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';

interface HistoryItem {
  id: number;
  timestamp: string;
  type: 'error' | 'deviation';
  title: string;
  inputDetails: string;
  resultDetails: string;
}

const CalibrationTool: React.FC = () => {
  // 1. Calibration Relative Error State
  const [stdVal, setStdVal] = useState('');
  const [measVal, setMeasVal] = useState('');
  // Changed to array to support multiple results
  const [calResults, setCalResults] = useState<{ input: number; result: string }[]>([]);

  // 2. Relative Deviation Before/After Use State
  const [beforeVal, setBeforeVal] = useState('');
  const [afterVal, setAfterVal] = useState('');
  const [devResult, setDevResult] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const deleteHistoryItem = (id: number) => {
    setHistory(history.filter(item => item.id !== id));
  };

  // Logic: (Measured - Standard) / Standard * 100%
  // Supports multiple measured values against one standard
  const calculateCalError = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseFloat(stdVal);
    
    if (isNaN(s)) { alert("请输入有效的标准值"); return; }
    if (s === 0) { alert("标准值不能为0"); return; }
    
    // Parse measured values: split by slash, space, comma, or multiple of them
    const mArr = measVal.split(/[\/\s,]+/).map(str => parseFloat(str.trim())).filter(n => !isNaN(n));
    
    if (mArr.length === 0) { alert("请输入至少一个测量值"); return; }

    const results = mArr.map(m => {
      const res = ((m - s) / s) * 100;
      return { input: m, result: res.toFixed(2) };
    });
    
    setCalResults(results);

    // Save History
    const mStr = mArr.join(', ');
    const resStr = results.map(r => `${r.result}%`).join(', ');
    const trunc = (s: string) => s.length > 20 ? s.substring(0, 20) + '...' : s;

    const newItem: HistoryItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'error',
      title: '校准相对误差',
      inputDetails: `标准:${s}, 测量:[${trunc(mStr)}]`,
      resultDetails: `结果:[${trunc(resStr)}]`
    };
    setHistory(prev => [newItem, ...prev]);
  };

  // Logic: (Before - After) / (Before + After) * 100%
  const calculateDevError = (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseFloat(beforeVal);
    const a = parseFloat(afterVal);
    if (isNaN(b) || isNaN(a)) { alert("请输入有效数值"); return; }
    if (b + a === 0) { alert("使用前与使用后数值之和不能为0"); return; }

    const resRaw = ((b - a) / (b + a)) * 100;
    const res = resRaw.toFixed(2);
    setDevResult(res);

    // Save History
    const newItem: HistoryItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'deviation',
      title: '前后相对偏差',
      inputDetails: `前:${b}, 后:${a}`,
      resultDetails: `结果: ${res}%`
    };
    setHistory(prev => [newItem, ...prev]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tool 1: Calibration Relative Error */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
            <ScaleIcon className="w-5 h-5 mr-2 text-brand-600" />
            校准相对误差
          </h3>
          <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
            公式: (测量值 - 标准值) / 标准值 × 100%
          </p>
          <form onSubmit={calculateCalError} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">标准值</label>
              <input
                type="number"
                step="any"
                required
                value={stdVal}
                onChange={e => setStdVal(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                placeholder="输入标准气体或设备标准值"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                测量值 <span className="text-xs text-gray-400 font-normal ml-1">(可用空格或 / 分隔多个数值)</span>
              </label>
              <input
                type="text"
                required
                value={measVal}
                onChange={e => setMeasVal(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                placeholder="例如: 99 101 / 100.5"
              />
            </div>
            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 shadow-sm transition-colors mt-2">
              计算误差
            </button>
          </form>

          {calResults.length > 0 && (
            <div className="mt-6 animate-fade-in bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
               <div className="grid grid-cols-2 bg-gray-100 p-2 text-xs font-medium text-gray-500 text-center">
                 <div>测量值</div>
                 <div>相对误差</div>
               </div>
               <div className="divide-y divide-gray-200">
                 {calResults.map((item, idx) => (
                   <div key={idx} className="grid grid-cols-2 p-3 text-sm text-center items-center">
                     <div className="text-gray-700 font-mono">{item.input}</div>
                     <div className={`font-bold font-mono ${parseFloat(item.result) > 0 ? 'text-red-600' : parseFloat(item.result) < 0 ? 'text-blue-600' : 'text-gray-700'}`}>
                       {item.result}%
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Tool 2: Relative Deviation Before/After Use */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
            <WrenchScrewdriverIcon className="w-5 h-5 mr-2 text-brand-600" />
            使用前后相对偏差
          </h3>
          <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
            公式: (使用前 - 使用后) / (使用前 + 使用后) × 100%
          </p>
          <form onSubmit={calculateDevError} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">使用前数值</label>
              <input
                type="number"
                step="any"
                required
                value={beforeVal}
                onChange={e => setBeforeVal(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                placeholder="输入使用前的标定/测试值"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">使用后数值</label>
              <input
                type="number"
                step="any"
                required
                value={afterVal}
                onChange={e => setAfterVal(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                placeholder="输入使用后的标定/测试值"
              />
            </div>
            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 shadow-sm transition-colors mt-2">
              计算偏差
            </button>
          </form>

          {devResult !== null && (
            <div className="mt-6 text-center animate-fade-in">
              <span className="block text-sm text-gray-500">相对偏差结果</span>
              <span className="block text-4xl font-bold text-brand-700 mt-1">
                {devResult}%
              </span>
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
                  <span className={`text-xs px-2 py-1 rounded font-medium ${item.type === 'error' ? 'bg-orange-50 text-orange-700' : 'bg-teal-50 text-teal-700'}`}>
                    {item.title}
                  </span>
                  <span className="text-xs text-gray-400">{item.timestamp}</span>
                </div>
                
                <div className="mb-2">
                   <div className="text-lg font-bold text-brand-700 break-all">{item.resultDetails}</div>
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

export default CalibrationTool;