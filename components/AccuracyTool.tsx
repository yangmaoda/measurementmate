import React, { useState } from 'react';
import { 
  ChartBarSquareIcon, 
  CalculatorIcon, 
  TableCellsIcon, 
  AdjustmentsHorizontalIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// 95% Confidence Level t-values (two-tailed alpha=0.05)
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
  const keys = Object.keys(T_TABLE).map(Number).sort((a, b) => a - b);
  let selected = keys[0];
  for (const k of keys) {
    if (k <= df) selected = k;
    else break;
  }
  return T_TABLE[selected];
};

// Excel-style rounding helper
const roundExcel = (num: number, decimals: number): number => {
  const p = Math.pow(10, decimals);
  return Math.round(num * p) / p;
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
  isQualified: boolean;
}

const AccuracyTool: React.FC = () => {
  const [mode, setMode] = useState<CalcMode>('method1');
  
  const [refInputList, setRefInputList] = useState('');
  const [cemsInput, setCemsInput] = useState('');
  
  const [result, setResult] = useState<{
    mode: CalcMode;
    n: number;
    avgRef: string;
    avgCems: string;
    avgDiff: string;
    sd: string;
    tValue: number;
    cc: string;
    ra: string;
    re: string;
    isQualified: boolean;
    details: { ref: number; cems: number; diff: number }[];
  } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parse = (s: string) => s.split(/[\/\s,]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n));
    const cems = parse(cemsInput);

    let refs: number[] = [];
    if (mode === 'method1') {
      refs = parse(refInputList);
      if (refs.length === 0) { alert("请输入参比数据"); return; }
      if (refs.length !== cems.length) { alert(`数据数量不匹配`); return; }
      if (refs.length !== 6 && refs.length !== 9) { alert(`纠错：仅支持 6 组或 9 组数据。`); return; }
    } else {
      // Logic for single ref input could be added back if needed, but current focus is on standard RA
      alert("请切换到标准输入模式");
      return;
    }

    const n = cems.length;
    
    // 1. Averages - Round to 2 decimals
    const avgRef = roundExcel(refs.reduce((a, b) => a + b, 0) / n, 2);
    const avgCems = roundExcel(cems.reduce((a, b) => a + b, 0) / n, 2);

    if (avgRef === 0) { alert("参比均值为0"); return; }

    // 2. Details and Mean Difference
    const details = cems.map((c, i) => ({
      ref: refs[i],
      cems: c,
      diff: roundExcel(refs[i] - c, 4) 
    }));
    const avgDiff = roundExcel(details.reduce((a, b) => a + b.diff, 0) / n, 2);

    // 3. Standard Deviation Sd - Keep 4 decimals
    const sumSqDiff = details.reduce((a, b) => a + Math.pow(b.diff - avgDiff, 2), 0);
    const sd = roundExcel(Math.sqrt(sumSqDiff / (n - 1)), 4);

    // 4. Confidence Coefficient CC - Keep 4 decimals
    // NOTE: Math.sqrt(n) is used with native precision, matching Excel's SQRT() behavior
    const df = n - 1;
    const t = getTValue(df);
    const cc = roundExcel(Math.abs(t * sd / Math.sqrt(n)), 4);

    // 5. Final RA/RE - Keep 4 decimals before % conversion
    const raDecimal = roundExcel((Math.abs(avgDiff) + cc) / avgRef, 4);
    const reDecimal = roundExcel((avgCems - avgRef) / avgRef, 4);
    
    const raDisplay = (raDecimal * 100).toFixed(2);
    const reDisplay = (reDecimal * 100).toFixed(2);
    
    const isQualified = raDecimal <= 0.15;

    setResult({
      mode,
      n,
      avgRef: avgRef.toFixed(2),
      avgCems: avgCems.toFixed(2),
      avgDiff: avgDiff.toFixed(2),
      sd: sd.toFixed(4),
      tValue: t,
      cc: cc.toFixed(4),
      ra: raDisplay,
      re: reDisplay,
      isQualified,
      details
    });

    const cleanStr = (s: string) => s.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    const trunc = (s: string, len: number) => s.length > len ? s.substring(0, len) + '...' : s;

    const inputSummary = `n=${n} | 参比[${trunc(cleanStr(refInputList), 10)}] | CEMS[${trunc(cleanStr(cemsInput), 10)}]`;

    const newItem: HistoryItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      mode: mode,
      ra: raDisplay,
      re: reDisplay,
      avgRef: avgRef.toFixed(2),
      avgCems: avgCems.toFixed(2),
      inputSummary,
      isQualified
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
            计算相对准确度 (RA)
          </h2>
          <div className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
            Excel 对齐模式：均值(2位) / 统计(4位)
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6 bg-brand-50 p-3 rounded-lg border border-brand-100 flex items-start">
          <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2 text-brand-500 shrink-0 mt-0.5" />
          <span className="space-y-1 text-xs">
            <span className="block font-semibold text-brand-800">计算规则校准：</span>
            <ul className="list-disc list-inside space-y-1 text-brand-700">
              <li><span className="font-bold">高精度开方：</span>CC 计算中的 SQRT(n) 使用系统原生精度，不进行预截断。</li>
              <li><span className="font-bold">二级修约：</span>均值类（Ref/CEMS/d̅）保留 2 位；统计类（Sd/CC/RA值）保留 4 位。</li>
              <li>强制校验：仅支持 6 组或 9 组数据对。</li>
            </ul>
          </span>
        </p>

        <form onSubmit={calculate} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">参比方法 (Ref) <span className="text-red-500 font-bold ml-1">*仅限 6 或 9 组</span></label>
            <textarea rows={7} value={refInputList} onChange={e => setRefInputList(e.target.value)} placeholder="请输入参比读数..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">在线测量 (CEMS) <span className="text-red-500 font-bold ml-1">*仅限 6 或 9 组</span></label>
            <textarea rows={7} value={cemsInput} onChange={e => setCemsInput(e.target.value)} placeholder="请输入 CEMS 读数..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 font-mono text-sm" />
          </div>
          <div className="lg:col-span-2">
            <button type="submit" className="w-full flex justify-center items-center px-6 py-3 bg-brand-600 text-white rounded-lg font-medium shadow hover:bg-brand-700 transition-colors">
              <CalculatorIcon className="w-6 h-6 mr-2" /> 计算相对准确度
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="animate-fade-in space-y-6">
          <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${result.isQualified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              {result.isQualified ? <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" /> : <XCircleIcon className="w-8 h-8 text-red-600 mr-3" />}
              <div>
                <h3 className={`font-bold ${result.isQualified ? 'text-green-800' : 'text-red-800'}`}>判定：{result.isQualified ? '合格' : '不合格'}</h3>
                <p className="text-xs opacity-70">判定标准：RA ≤ 15.00%</p>
              </div>
            </div>
            <div className="text-right"><span className="text-lg font-bold">RA: {result.ra}%</span></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
               <span className="text-xs text-gray-500 uppercase tracking-widest">相对准确度 (RA)</span>
               <div className="text-3xl font-black text-gray-900 mt-1">{result.ra}%</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
               <span className="text-xs text-gray-500 uppercase tracking-widest">相对误差 (RE)</span>
               <div className="text-3xl font-black text-gray-900 mt-1">{result.re}%</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center text-sm">
              <span className="font-bold flex items-center text-gray-700"><TableCellsIcon className="w-4 h-4 mr-1 text-gray-400" />计算中间值核对</span>
              <span className="bg-white px-2 py-0.5 rounded border border-gray-300 text-xs font-mono">n = {result.n}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-5 text-sm">
               <div><p className="text-gray-400 text-xs mb-1">参比均值(2位)</p><p className="font-mono font-bold">{result.avgRef}</p></div>
               <div><p className="text-gray-400 text-xs mb-1">CEMS均值(2位)</p><p className="font-mono font-bold">{result.avgCems}</p></div>
               <div><p className="text-gray-400 text-xs mb-1">平均差值(2位)</p><p className="font-mono font-bold">{result.avgDiff}</p></div>
               <div><p className="text-gray-400 text-xs mb-1">标准差Sd(4位)</p><p className="font-mono font-bold text-gray-700">{result.sd}</p></div>
               <div><p className="text-gray-400 text-xs mb-1">t分布值</p><p className="font-mono font-bold text-brand-600">{result.tValue.toFixed(3)}</p></div>
               <div><p className="text-gray-400 text-xs mb-1">置信系数CC(4位)</p><p className="font-mono font-bold text-brand-600">{result.cc}</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-500">
                  <tr><th className="px-6 py-2">#</th><th className="px-6 py-2">参比 (Ref)</th><th className="px-6 py-2">在线 (CEMS)</th><th className="px-6 py-2">修约差值 (dᵢ)</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {result.details.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-2 text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-2 font-bold">{row.ref}</td>
                      <td className="px-6 py-2">{row.cems}</td>
                      <td className="px-6 py-2 text-gray-500">{row.diff.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-6">
          <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center"><ClockIcon className="w-4 h-4 mr-1" />历史记录 (最近)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 relative group hover:shadow-sm transition-all">
                <button onClick={() => deleteHistoryItem(item.id)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><TrashIcon className="w-3 h-3" /></button>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.isQualified ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{item.isQualified ? '合格' : '不合格'}</span>
                  <span className="text-[10px] text-gray-400">{item.timestamp}</span>
                </div>
                <div className="flex justify-between items-baseline">
                   <div className="text-lg font-black text-gray-800">RA: {item.ra}%</div>
                   <div className="text-xs text-gray-500">RE: {item.re}%</div>
                </div>
                <div className="mt-2 pt-1 border-t border-gray-50 text-[10px] text-gray-400 truncate" title={item.inputSummary}>{item.inputSummary}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccuracyTool;