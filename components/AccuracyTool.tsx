import React, { useState } from 'react';
import { 
  ChartBarSquareIcon, 
  CalculatorIcon, 
  TableCellsIcon, 
  AdjustmentsHorizontalIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// 95% Confidence Level t-values (two-tailed alpha=0.05)
// Key is degrees of freedom (f = n - 1)
const T_TABLE: Record<number, number> = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
  6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
  11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
  16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
  21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
  26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042,
  35: 2.030, 40: 2.021, 45: 2.014, 50: 2.009, 60: 2.000,
  80: 1.990, 100: 1.984, 120: 1.980, 999: 1.960 
};

const getTValue = (df: number): number => {
  if (T_TABLE[df]) return T_TABLE[df];
  // Find nearest lower key if exact match not found
  const keys = Object.keys(T_TABLE).map(Number).sort((a, b) => a - b);
  let selected = keys[0];
  for (const k of keys) {
    if (k <= df) selected = k;
    else break;
  }
  return T_TABLE[selected];
};

type CalcMode = 'method1' | 'method2';

interface HistoryItem {
  id: number;
  timestamp: string;
  mode: CalcMode;
  ra: string;
  re: string;
  avgRef: string;
  avgCems: string;
  inputSummary: string;
}

const AccuracyTool: React.FC = () => {
  const [mode, setMode] = useState<CalcMode>('method1');
  
  // Inputs
  const [refInputList, setRefInputList] = useState(''); // Method 1 List
  const [refInputSingle, setRefInputSingle] = useState(''); // Method 2 Single Value
  const [cemsInput, setCemsInput] = useState(''); // Common
  
  const [result, setResult] = useState<{
    mode: CalcMode;
    n: number;
    avgRef: string;
    avgCems: string;
    avgDiff: string; // d_bar
    sd: string; // Sd
    tValue: number;
    cc: string; // Confidence Coefficient
    ra: string; // Relative Accuracy
    re: string; // Relative Error
    details: { ref: number; cems: number; diff: number }[];
  } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Helper to parse lists
    const parse = (s: string) => s.split(/[\/\s,]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n));
    
    // Parse CEMS (common for both methods)
    const cems = parse(cemsInput);
    if (cems.length < 2) {
      alert("样本数量 (n) 必须至少为 2 以计算标准差");
      return;
    }

    let refs: number[] = [];

    if (mode === 'method1') {
      refs = parse(refInputList);
      if (refs.length === 0) {
        alert("请输入参比数据");
        return;
      }
      if (refs.length !== cems.length) {
        alert(`数据数量不匹配: 参比值有 ${refs.length} 个，CEMS值有 ${cems.length} 个`);
        return;
      }
    } else {
      // Method 2: Single Reference Value
      const val = parseFloat(refInputSingle);
      if (isNaN(val)) {
        alert("请输入有效的参比数值");
        return;
      }
      // Fill array with the single value for calculation consistency
      refs = new Array(cems.length).fill(val);
    }

    const n = cems.length;
    // Calculate differences: Ref - CEMS
    const details = cems.map((c, i) => {
      const r = refs[i];
      return {
        ref: r,
        cems: c,
        diff: r - c 
      };
    });

    // 1. Averages
    let avgRefRaw = 0;
    if (mode === 'method1') {
      avgRefRaw = refs.reduce((a, b) => a + b, 0) / n;
    } else {
      // Method 2: Average is the input itself
      avgRefRaw = refs[0];
    }
    const avgCemsRaw = cems.reduce((a, b) => a + b, 0) / n;

    // Apply rounding to 1 decimal place as requested
    const avgRef = Math.round(avgRefRaw * 10) / 10;
    const avgCems = Math.round(avgCemsRaw * 10) / 10;

    if (avgRef === 0) {
      alert("参比方法平均值(修约后)为0，无法作为分母计算相对准确度");
      return;
    }

    // 2. Mean Difference (d_bar)
    // First calculate exact mean for Sd
    const avgDiffRaw = details.reduce((a, b) => a + b.diff, 0) / n;
    // Round to 1 decimal place as requested for display and RA calculation
    const avgDiff = Math.round(avgDiffRaw * 10) / 10;

    // 3. Standard Deviation (Sd)
    // Use raw mean difference for Sd calculation
    const sumSqDiff = details.reduce((a, b) => a + Math.pow(b.diff - avgDiffRaw, 2), 0);
    const sd = Math.sqrt(sumSqDiff / (n - 1));

    // 4. t-value
    const df = n - 1;
    const t = getTValue(df);

    // 5. Confidence Coefficient (CC) = | t * Sd / sqrt(n) |
    const cc = Math.abs(t * sd / Math.sqrt(n));

    // 6. Relative Accuracy (RA) = (CC + |avgDiff|) / avgRef * 100
    // Uses the rounded avgDiff as requested
    const raVal = ((cc + Math.abs(avgDiff)) / avgRef) * 100;

    // 7. Relative Error (RE) = (avgCems - avgRef) / avgRef * 100
    // Uses the rounded averages
    const reVal = ((avgCems - avgRef) / avgRef) * 100;

    const finalAvgRef = avgRef.toFixed(1);
    const finalAvgCems = avgCems.toFixed(1);
    const finalRa = raVal.toFixed(2);
    const finalRe = reVal.toFixed(2);

    setResult({
      mode,
      n,
      avgRef: finalAvgRef,
      avgCems: finalAvgCems,
      avgDiff: avgDiff.toFixed(1),
      sd: sd.toFixed(4),
      tValue: t,
      cc: cc.toFixed(4),
      ra: finalRa,
      re: finalRe,
      details
    });

    // --- Automatic History Saving ---
    const cleanStr = (s: string) => s.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    const trunc = (s: string, len: number) => s.length > len ? s.substring(0, len) + '...' : s;

    let inputSummary = '';
    if (mode === 'method1') {
      inputSummary = `参比[${trunc(cleanStr(refInputList), 15)}] | CEMS[${trunc(cleanStr(cemsInput), 15)}]`;
    } else {
      inputSummary = `基准[${refInputSingle}] | CEMS[${trunc(cleanStr(cemsInput), 25)}]`;
    }

    const newItem: HistoryItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      mode: mode,
      ra: finalRa,
      re: finalRe,
      avgRef: finalAvgRef,
      avgCems: finalAvgCems,
      inputSummary
    };

    setHistory(prev => [newItem, ...prev]);
  };

  const deleteHistoryItem = (id: number) => {
    setHistory(history.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <ChartBarSquareIcon className="w-6 h-6 mr-2 text-brand-600" />
            计算相对准确度
          </h2>
          
          {/* Mode Toggles */}
          <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
            <button
              onClick={() => { setMode('method1'); setResult(null); }}
              className={`px-4 py-2 rounded-md transition-all ${mode === 'method1' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              方案1：多对多
            </button>
            <button
              onClick={() => { setMode('method2'); setResult(null); }}
              className={`px-4 py-2 rounded-md transition-all ${mode === 'method2' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              方案2：多对一
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6 bg-brand-50 p-3 rounded-lg border border-brand-100 flex items-start">
          <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2 text-brand-500 shrink-0 mt-0.5" />
          <span>
            {mode === 'method1' 
              ? '适用于「标准比对」场景：输入一一对应的参比值和 CEMS 值。' 
              : '适用于「多次在线对比单一手工」场景：输入一个手工值作为基准，输入多个在线值进行比对。'}
            <br className="mb-1"/>
            <span className="font-bold opacity-80">计算规则：均值及平均差值保留一位小数参与计算。</span>
          </span>
        </p>

        <form onSubmit={calculate} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 
             Layout Ordering Logic:
             We use order-1, order-2, order-3 to control visual flow regardless of DOM order.
             Method 1: Ref(1), CEMS(2), Button(3) -> Standard LTR
             Method 2: CEMS(1), Ref(2), Button(3) -> Swapped columns, Button bottom
          */}

          {/* Ref Input Container */}
          <div className={`space-y-2 ${mode === 'method2' ? 'order-2' : 'order-1'}`}>
            <label className="block text-sm font-medium text-gray-700">
              {mode === 'method1' ? '参比方法值 (标准值列表)' : '个人测量值 (单一数值)'}
              {mode === 'method1' && <span className="text-xs text-gray-400 font-normal ml-2">空格或 / 分隔</span>}
            </label>
            
            {mode === 'method1' ? (
              <textarea
                rows={8}
                value={refInputList}
                onChange={e => setRefInputList(e.target.value)}
                placeholder="例如:&#10;10.1&#10;10.2&#10;10.1&#10;..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 font-mono text-sm"
              />
            ) : (
              <div className="h-full">
                <input
                  type="number"
                  step="any"
                  value={refInputSingle}
                  onChange={e => setRefInputSingle(e.target.value)}
                  placeholder="例如: 10.5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 font-mono text-lg"
                />
                <p className="mt-2 text-xs text-gray-500">
                  在此模式下，该数值将被作为所有在线数据的基准值进行差值计算。
                  <br/>平均值直接取该值（保留一位小数）。
                </p>
              </div>
            )}
          </div>
          
          {/* CEMS Input Container */}
          <div className={`space-y-2 ${mode === 'method2' ? 'order-1' : 'order-2'}`}>
            <label className="block text-sm font-medium text-gray-700">
              在线测量值列表 (多数值)
              <span className="text-xs text-gray-400 font-normal ml-2">空格或 / 分隔</span>
            </label>
            <textarea
              rows={8}
              value={cemsInput}
              onChange={e => setCemsInput(e.target.value)}
              placeholder="例如:&#10;10.3&#10;10.4&#10;10.2&#10;..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 font-mono text-sm"
            />
          </div>

          <div className="lg:col-span-2 order-3">
            <button
              type="submit"
              className="w-full flex justify-center items-center px-6 py-3 bg-brand-600 text-white rounded-lg font-medium shadow-sm hover:bg-brand-700 transition-colors text-lg"
            >
              <CalculatorIcon className="w-6 h-6 mr-2" />
              开始计算 ({mode === 'method1' ? '方案1' : '方案2'})
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="animate-fade-in space-y-6">
          {/* Main Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-brand-500">
               <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">相对准确度 (Relative Accuracy)</span>
               <div className="mt-2 flex items-baseline">
                 <span className="text-4xl font-extrabold text-gray-900">{result.ra}%</span>
                 <span className="ml-2 text-xs text-gray-500 font-mono">公式: (CC + |d̅|) / Ref̅</span>
               </div>
             </div>
             
             <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
               <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">相对误差 (Relative Error)</span>
               <div className="mt-2 flex items-baseline">
                 <span className={`text-4xl font-extrabold ${parseFloat(result.re) > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                   {result.re}%
                 </span>
                 <span className="ml-2 text-xs text-gray-500 font-mono">公式: (CEMS̅ - Ref̅) / Ref̅</span>
               </div>
             </div>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <TableCellsIcon className="w-5 h-5 mr-2 text-gray-500" />
                计算详情
              </h3>
              <span className="text-xs bg-white border border-gray-300 px-2 py-1 rounded text-gray-600">
                样本数 n = {result.n}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50/50 text-sm border-b border-gray-100">
               <div>
                 <p className="text-gray-500">参比均值 (Ref̅)</p>
                 <p className="font-mono font-bold">{result.avgRef}</p>
               </div>
               <div>
                 <p className="text-gray-500">CEMS均值 (CEMS̅)</p>
                 <p className="font-mono font-bold">{result.avgCems}</p>
               </div>
               <div>
                 <p className="text-gray-500">平均差值 (d̅)</p>
                 <p className="font-mono font-bold text-gray-700">{result.avgDiff}</p>
               </div>
               <div>
                 <p className="text-gray-500">标准差 (Sd)</p>
                 <p className="font-mono font-bold text-gray-700">{result.sd}</p>
               </div>
               <div>
                 <p className="text-gray-500">t值 (t₀.₉₅)</p>
                 <p className="font-mono font-bold text-brand-600">{result.tValue.toFixed(3)}</p>
               </div>
               <div>
                 <p className="text-gray-500">置信系数 (CC)</p>
                 <p className="font-mono font-bold text-brand-600">{result.cc}</p>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 font-medium">
                  <tr>
                    <th className="px-6 py-3 w-16">#</th>
                    <th className="px-6 py-3">参比方法值</th>
                    <th className="px-6 py-3">CEMS法值</th>
                    <th className="px-6 py-3">数据对差 (dᵢ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.details.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-3 font-mono">
                        {row.ref}
                        {result.mode === 'method2' && <span className="text-xs text-gray-400 ml-1">(固定)</span>}
                      </td>
                      <td className="px-6 py-3 font-mono">{row.cems}</td>
                      <td className="px-6 py-3 font-mono text-gray-600">{row.diff.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                  <span className={`text-xs px-2 py-1 rounded font-medium ${item.mode === 'method1' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                    {item.mode === 'method1' ? '方案1 (多对多)' : '方案2 (多对一)'}
                  </span>
                  <span className="text-xs text-gray-400">{item.timestamp}</span>
                </div>
                
                <div className="flex justify-between items-baseline mb-3">
                  <div className="text-center">
                    <span className="block text-xs text-gray-500 uppercase">相对准确度</span>
                    <span className="block text-xl font-bold text-gray-800">{item.ra}%</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-500 uppercase">相对误差</span>
                    <span className="block text-xl font-bold text-gray-800">{item.re}%</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1 mb-2">
                  <div className="flex justify-between">
                    <span>参比均值: {item.avgRef}</span>
                    <span>CEMS均值: {item.avgCems}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 font-mono truncate" title={item.inputSummary}>
                    {item.inputSummary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccuracyTool;