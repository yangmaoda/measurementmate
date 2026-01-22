
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

// Standard rounding to fixed decimals
const roundTo = (num: number, decimals: number): number => {
  const p = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * p) / p;
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
  const [refInputList, setRefInputList] = useState('');
  const [cemsInput, setCemsInput] = useState('');
  
  const [result, setResult] = useState<{
    n: number;
    avgRefRounded: number;
    avgCemsRounded: number;
    avgDiffCalc: number;
    sdRaw: number;
    tValue: number;
    ccRaw: number;
    raDisplay: string;
    reDisplay: string;
    isQualified: boolean;
    details: { ref: number; cems: number; diff: number }[];
  } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parse = (s: string) => s.split(/[\/\s,]+/).map(v => parseFloat(v.trim())).filter(n => !isNaN(n));
    const refs = parse(refInputList);
    const cems = parse(cemsInput);

    if (refs.length === 0 || cems.length === 0) {
      alert("请输入数据");
      return;
    }
    if (refs.length !== cems.length) {
      alert(`参比数据 (${refs.length}) 与 CEMS 数据 (${cems.length}) 数量不匹配`);
      return;
    }
    if (refs.length !== 6 && refs.length !== 9) {
      alert(`标准规范：仅支持 6 组或 9 组数据对。当前收到 ${refs.length} 组。`);
      return;
    }

    const n = refs.length;

    // 1. 数据对差值 (di) - 不修约
    const details = refs.map((r, i) => ({
      ref: r,
      cems: cems[i],
      diff: r - cems[i] 
    }));

    // 2. 参比方法和 CEMS 的平均值 - 计算后修约到两位小数
    const avgRefRounded = roundTo(refs.reduce((a, b) => a + b, 0) / n, 2);
    const avgCemsRounded = roundTo(cems.reduce((a, b) => a + b, 0) / n, 2);

    if (avgRefRounded === 0) {
      alert("参比均值为 0，无法计算。");
      return;
    }

    // 3. 平均数据对差 (d_avg)
    const avgDiffCalc = avgRefRounded - avgCemsRounded;

    // 4. 标准差 Sd - 使用原始差值计算
    const diValues = details.map(d => d.diff);
    const diAvgRaw = diValues.reduce((a, b) => a + b, 0) / n;
    const sumSqDiff = diValues.reduce((a, b) => a + Math.pow(b - diAvgRaw, 2), 0);
    const sdRaw = Math.sqrt(sumSqDiff / (n - 1));

    // 5. 置信系数 CC
    const df = n - 1;
    const tValue = getTValue(df);
    const ccRaw = Math.abs((tValue * sdRaw) / Math.sqrt(n));

    // 6. 相对准确度 RA 计算与修约
    const raRaw = (Math.abs(avgDiffCalc) + ccRaw) / avgRefRounded;
    // 逻辑：保留为四位小数后，再转换成百分比显示 (即百分比保留2位)
    const raRounded = roundTo(raRaw, 4);
    const raDisplay = (raRounded * 100).toFixed(2);

    // 7. 相对误差 RE 计算与修约
    const reRaw = (avgCemsRounded - avgRefRounded) / avgRefRounded;
    // 逻辑：保留为三位小数后，再转换成百分比显示 (即百分比保留1位)
    const reRounded = roundTo(reRaw, 3);
    const reDisplay = (reRounded * 100).toFixed(1);

    // 判定逻辑基于修约后的结果
    const isQualified = raRounded <= 0.15;

    setResult({
      n,
      avgRefRounded,
      avgCemsRounded,
      avgDiffCalc,
      sdRaw,
      tValue,
      ccRaw,
      raDisplay,
      reDisplay,
      isQualified,
      details
    });

    const inputSummary = `n=${n} | 参比[${refs.slice(0,2).join(',')}...] | CEMS[${cems.slice(0,2).join(',')}...]`;
    const newItem: HistoryItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      mode: 'method1',
      ra: raDisplay,
      re: reDisplay,
      avgRef: avgRefRounded.toFixed(2),
      avgCems: avgCemsRounded.toFixed(2),
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
            相对准确度 (RA) 精确计算
          </h2>
          <div className="text-xs text-brand-600 font-bold bg-brand-50 px-3 py-1 rounded-full border border-brand-200 uppercase tracking-tight">
            Excel 逻辑对齐：多级修约模式
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-start mb-2">
            <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2 text-slate-500 shrink-0 mt-0.5" />
            <h4 className="font-bold text-slate-800">最新订正修约规则：</h4>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600 list-disc list-inside">
            <li>参比 & CEMS 平均值：<span className="font-bold text-brand-700">修约至 2 位小数</span></li>
            <li>相对准确度 (RA)：比例修约至 <span className="font-bold text-brand-700">4 位小数</span> → 转 <span className="font-bold text-brand-700">2 位百分数</span></li>
            <li>相对误差 (RE)：比例修约至 <span className="font-bold text-brand-700">3 位小数</span> → 转 <span className="font-bold text-brand-700">1 位百分数</span></li>
            <li>判定依据：<span className="font-bold text-brand-700">RA (修约后) ≤ 15.00%</span></li>
          </ul>
        </div>

        <form onSubmit={calculate} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">参比方法读数 (Ref)</label>
            <textarea 
              rows={6} 
              value={refInputList} 
              onChange={e => setRefInputList(e.target.value)} 
              placeholder="每组读数空格或换行分隔..." 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 font-mono text-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">CEMS 测量读数</label>
            <textarea 
              rows={6} 
              value={cemsInput} 
              onChange={e => setCemsInput(e.target.value)} 
              placeholder="每组读数空格或换行分隔..." 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 font-mono text-sm" 
            />
          </div>
          <div className="lg:col-span-2">
            <button type="submit" className="w-full flex justify-center items-center px-6 py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-all active:scale-[0.98]">
              <CalculatorIcon className="w-6 h-6 mr-2" /> 执行精确判定
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="animate-fade-in space-y-6">
          {/* Result Card */}
          <div className={`p-6 rounded-2xl border-2 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 ${result.isQualified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              {result.isQualified ? (
                <div className="bg-green-500 p-3 rounded-full mr-4 shadow-sm"><CheckCircleIcon className="w-10 h-10 text-white" /></div>
              ) : (
                <div className="bg-red-500 p-3 rounded-full mr-4 shadow-sm"><XCircleIcon className="w-10 h-10 text-white" /></div>
              )}
              <div>
                <h3 className={`text-2xl font-black ${result.isQualified ? 'text-green-900' : 'text-red-900'}`}>判定：{result.isQualified ? '合格' : '不合格'}</h3>
                <p className="text-sm opacity-80 mt-1">判据：RA (修约后) ≤ 15.00%</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center w-full md:w-auto">
              <div className="text-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">相对准确度 (RA)</span>
                <div className="text-5xl font-black text-slate-900">{result.raDisplay}%</div>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">相对误差 (RE)</span>
                <div className="text-3xl font-black text-slate-700">{result.reDisplay}%</div>
              </div>
            </div>
          </div>

          {/* Intermediate Values */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold flex items-center text-gray-700 text-base"><TableCellsIcon className="w-5 h-5 mr-2 text-brand-500" />中间参数核对区</span>
              <span className="bg-white px-3 py-1 rounded-full border border-gray-300 text-xs font-mono font-bold text-gray-500">n = {result.n}</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 p-6">
               <div className="group">
                 <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">参比均值 (修2位)</p>
                 <p className="font-mono text-xl font-bold text-slate-800">{result.avgRefRounded.toFixed(2)}</p>
               </div>
               <div className="group">
                 <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">CEMS均值 (修2位)</p>
                 <p className="font-mono text-xl font-bold text-slate-800">{result.avgCemsRounded.toFixed(2)}</p>
               </div>
               <div className="group">
                 <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">均值差 d_avg</p>
                 <p className="font-mono text-xl font-bold text-brand-600">{result.avgDiffCalc.toFixed(2)}</p>
               </div>
               <div className="group">
                 <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">标准差 Sd (未修)</p>
                 <p className="font-mono text-xl font-bold text-slate-800">{result.sdRaw.toFixed(6)}</p>
               </div>
               <div className="group">
                 <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">置信系数 CC (未修)</p>
                 <p className="font-mono text-xl font-bold text-brand-600">{result.ccRaw.toFixed(6)}</p>
               </div>
            </div>

            <div className="overflow-x-auto border-t border-gray-100">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">序号</th>
                    <th className="px-6 py-3">参比读数 (Ref)</th>
                    <th className="px-6 py-3">在线读数 (CEMS)</th>
                    <th className="px-6 py-3">原始差值 (di)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {result.details.map((row, idx) => (
                    <tr key={idx} className="hover:bg-brand-50 transition-colors">
                      <td className="px-6 py-2 text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-2 font-bold text-slate-800">{row.ref}</td>
                      <td className="px-6 py-2 text-slate-600">{row.cems}</td>
                      <td className="px-6 py-2 text-slate-400">{row.diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-8">
          <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center uppercase tracking-widest"><ClockIcon className="w-4 h-4 mr-2" />历史判定记录</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 relative group hover:shadow-md transition-all">
                <button onClick={() => deleteHistoryItem(item.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.isQualified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.isQualified ? '合格' : '不合格'}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{item.timestamp}</span>
                </div>
                <div className="flex justify-between items-baseline mb-2">
                   <div className="text-xl font-black text-slate-800">RA: {item.ra}%</div>
                   <div className="text-[10px] font-bold text-slate-400">RE: {item.re}%</div>
                </div>
                <div className="pt-2 border-t border-gray-50 text-[10px] text-gray-400 truncate font-mono" title={item.inputSummary}>{item.inputSummary}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccuracyTool;
