import React, { useState } from 'react';
import { ChartBarSquareIcon, CalculatorIcon, TableCellsIcon } from '@heroicons/react/24/outline';

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

const AccuracyTool: React.FC = () => {
  const [refInput, setRefInput] = useState('');
  const [cemsInput, setCemsInput] = useState('');
  
  const [result, setResult] = useState<{
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

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse inputs
    const parse = (s: string) => s.split(/[\/\s,]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n));
    const refs = parse(refInput);
    const cems = parse(cemsInput);

    // Validation
    if (refs.length === 0 || cems.length === 0) {
      alert("请输入数据");
      return;
    }
    if (refs.length !== cems.length) {
      alert(`数据数量不匹配: 参比值有 ${refs.length} 个，CEMS值有 ${cems.length} 个`);
      return;
    }
    if (refs.length < 2) {
      alert("样本数量 (n) 必须至少为 2 以计算标准差");
      return;
    }

    const n = refs.length;
    const details = refs.map((r, i) => ({
      ref: r,
      cems: cems[i],
      diff: r - cems[i] // Difference d_i = R_i - C_i
    }));

    // 1. Averages
    const sumRef = refs.reduce((a, b) => a + b, 0);
    const sumCems = cems.reduce((a, b) => a + b, 0);
    
    // Apply rounding to 1 decimal place as requested
    const avgRef = Math.round((sumRef / n) * 10) / 10;
    const avgCems = Math.round((sumCems / n) * 10) / 10;

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
    // We use the raw mean difference for Sd calculation to maintain statistical validity of the variation,
    // even though we use the rounded mean for the final RA formula.
    const sumSqDiff = details.reduce((a, b) => a + Math.pow(b.diff - avgDiffRaw, 2), 0);
    const sd = Math.sqrt(sumSqDiff / (n - 1));

    // 4. t-value
    const df = n - 1;
    const t = getTValue(df);

    // 5. Confidence Coefficient (CC) = | t * Sd / sqrt(n) |
    const cc = Math.abs(t * sd / Math.sqrt(n));

    // 6. Relative Accuracy (RA) = (CC + |avgDiff|) / avgRef * 100
    // Uses the rounded avgDiff as requested
    const ra = ((cc + Math.abs(avgDiff)) / avgRef) * 100;

    // 7. Relative Error (RE) = (avgCems - avgRef) / avgRef * 100
    // Uses the rounded averages
    const re = ((avgCems - avgRef) / avgRef) * 100;

    setResult({
      n,
      avgRef: avgRef.toFixed(1), // Display with 1 decimal
      avgCems: avgCems.toFixed(1), // Display with 1 decimal
      avgDiff: avgDiff.toFixed(1), // Display with 1 decimal
      sd: sd.toFixed(4),
      tValue: t,
      cc: cc.toFixed(4),
      ra: ra.toFixed(2),
      re: re.toFixed(2),
      details
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4">
          <ChartBarSquareIcon className="w-6 h-6 mr-2 text-brand-600" />
          计算氧含量相对准确度
        </h2>
        <p className="text-sm text-gray-500 mb-6 bg-brand-50 p-3 rounded-lg border border-brand-100">
          依据标准流程计算：输入对应的数据对，自动计算 Sd、置信系数 CC、相对准确度及相对误差。
          <br/>支持 95% 置信水平 t 值表自动匹配，<span className="font-bold">所有均值保留一位小数参与计算</span>。
        </p>

        <form onSubmit={calculate} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              参比方法值 (标准值)
              <span className="text-xs text-gray-400 font-normal ml-2">空格或 / 分隔</span>
            </label>
            <textarea
              rows={8}
              value={refInput}
              onChange={e => setRefInput(e.target.value)}
              placeholder="例如:&#10;10.1&#10;10.2&#10;10.1&#10;..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              CEMS 法值 (测量值)
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

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full flex justify-center items-center px-6 py-3 bg-brand-600 text-white rounded-lg font-medium shadow-sm hover:bg-brand-700 transition-colors text-lg"
            >
              <CalculatorIcon className="w-6 h-6 mr-2" />
              开始计算
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
                      <td className="px-6 py-3 font-mono">{row.ref}</td>
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
    </div>
  );
};

export default AccuracyTool;