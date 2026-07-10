import React, { useState } from 'react';
import { CalculatorIcon, TrashIcon, ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface HistoryItem {
  id: number;
  timestamp: string;
  dc: string;
  db: string;
  wellDepth: string;
  buryDepth: string;
  depthUnit: 'm' | 'cm';
  h: number;
  v1: number;
  v2: number;
  vTotal: number;
  vWash: number;
}

const WellVolumeTool: React.FC = () => {
  const [dc, setDc] = useState('');
  const [db, setDb] = useState('');
  const [wellDepth, setWellDepth] = useState('');
  const [buryDepth, setBuryDepth] = useState('');
  const [depthUnit, setDepthUnit] = useState<'m' | 'cm'>('m');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Fixed porosity value
  const THETA = 0.3;

  // Real-time calculation values if valid
  let calculated: {
    wellDepthCm: number;
    buryDepthCm: number;
    h: number;
    v1: number;
    v2: number;
    vTotal: number;
    vWash: number;
    isValid: boolean;
    error?: string;
  } = {
    wellDepthCm: 0,
    buryDepthCm: 0,
    h: 0,
    v1: 0,
    v2: 0,
    vTotal: 0,
    vWash: 0,
    isValid: false
  };

  const parseInputs = () => {
    const valDc = parseFloat(dc);
    const valDb = parseFloat(db);
    const valWellDepth = parseFloat(wellDepth);
    const valBuryDepth = parseFloat(buryDepth);

    if (isNaN(valDc) || isNaN(valDb) || isNaN(valWellDepth) || isNaN(valBuryDepth)) {
      return { ...calculated, isValid: false };
    }

    if (valDc <= 0 || valDb <= 0 || valWellDepth < 0 || valBuryDepth < 0) {
      return { ...calculated, isValid: false, error: '输入数值必须大于0' };
    }

    if (valDb < valDc) {
      return { ...calculated, isValid: false, error: '钻孔直径 (db) 应大于等于井管直径 (dc)' };
    }

    if (valWellDepth < valBuryDepth) {
      return { ...calculated, isValid: false, error: '井深应大于等于埋深' };
    }

    const multiplier = depthUnit === 'm' ? 100 : 1;
    const wellDepthCm = valWellDepth * multiplier;
    const buryDepthCm = valBuryDepth * multiplier;
    const h = wellDepthCm - buryDepthCm;

    const PI_OVER_4 = Math.PI / 4;
    const v1 = PI_OVER_4 * (valDc * valDc) * h;
    const v2 = PI_OVER_4 * (valDb * valDb - valDc * valDc) * h * THETA;
    const vTotal = v1 + v2;
    const vWash = vTotal * 3;

    return {
      wellDepthCm,
      buryDepthCm,
      h,
      v1,
      v2,
      vTotal,
      vWash,
      isValid: true
    };
  };

  calculated = parseInputs();

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const result = parseInputs();
    if (!result.isValid) {
      return;
    }

    const newItem: HistoryItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      dc,
      db,
      wellDepth,
      buryDepth,
      depthUnit,
      h: result.h,
      v1: result.v1,
      v2: result.v2,
      vTotal: result.vTotal,
      vWash: result.vWash
    };

    setHistory([newItem, ...history]);
  };

  const clearForm = () => {
    setDc('');
    setDb('');
    setWellDepth('');
    setBuryDepth('');
  };

  const deleteHistoryItem = (id: number) => {
    setHistory(history.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Intro & Formula Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
          <InformationCircleIcon className="w-5 h-5 text-brand-600" />
          井水体积计算原理与计算公式
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          根据地下水环境监测技术规范（HJ 164-2020）要求，在采集地下水样品前，通常需要洗井。
          至少洗出约 <strong>3倍井体积</strong> 的水量，井体积用下式计算：
        </p>
        
        {/* Math Formula Panel */}
        <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center border border-gray-100 font-mono text-gray-700">
          <div className="text-base md:text-lg font-semibold select-all text-center">
            V = (&pi;/4 &times; d<sub>c</sub><sup>2</sup>) &times; h + (&pi;/4 &times; d<sub>b</sub><sup>2</sup> - &pi;/4 &times; d<sub>c</sub><sup>2</sup>) &times; h &times; &theta;
          </div>
          <div className="mt-4 text-xs text-gray-500 space-y-1 w-full text-left md:text-center">
            <p>• <strong>V</strong> —— 井体积，ml</p>
            <p>• <strong>d<sub>c</sub></strong> —— 井管直径，cm (用户输入)</p>
            <p>• <strong>d<sub>b</sub></strong> —— 钻孔直径，cm (用户输入)</p>
            <p>• <strong>h</strong> —— 井管中的水深，cm (井深 - 埋深，自动换算)</p>
            <p>• <strong>&theta;</strong> —— 填料的孔隙度，固定为 <strong>0.3</strong></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input & Calculator Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <CalculatorIcon className="w-5 h-5 text-brand-600" />
              参数输入与实时计算
            </h3>

            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* dc */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    井管直径 d<sub>c</sub> (cm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={dc}
                    onChange={(e) => setDc(e.target.value)}
                    placeholder="请输入井管直径"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    required
                  />
                </div>

                {/* db */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    钻孔直径 d<sub>b</sub> (cm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={db}
                    onChange={(e) => setDb(e.target.value)}
                    placeholder="请输入钻孔直径"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    required
                  />
                </div>

                {/* Depth Unit Selector */}
                <div className="md:col-span-2 bg-gray-50 p-2 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 pl-2">深度数据单位选择 (井深和埋深)</span>
                  <div className="flex bg-white border border-gray-200 rounded-md p-0.5">
                    <button
                      type="button"
                      onClick={() => setDepthUnit('m')}
                      className={`px-3 py-1 text-xs rounded transition-all ${
                        depthUnit === 'm' ? 'bg-brand-500 text-white font-medium' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      米 (m)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepthUnit('cm')}
                      className={`px-3 py-1 text-xs rounded transition-all ${
                        depthUnit === 'cm' ? 'bg-brand-500 text-white font-medium' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      厘米 (cm)
                    </button>
                  </div>
                </div>

                {/* Well Depth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    井深 ({depthUnit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={wellDepth}
                    onChange={(e) => setWellDepth(e.target.value)}
                    placeholder={`请输入井深`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    required
                  />
                </div>

                {/* Bury Depth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    埋深 ({depthUnit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={buryDepth}
                    onChange={(e) => setBuryDepth(e.target.value)}
                    placeholder={`请输入埋深`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              {/* Porosity Info */}
              <div className="text-xs text-gray-400 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-center">
                <span>填料的孔隙度 &theta; (固定值)</span>
                <span className="font-mono font-semibold text-brand-600">0.3</span>
              </div>

              {/* Validation errors */}
              {calculated.error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {calculated.error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!calculated.isValid}
                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  记录计算结果
                </button>
                <button
                  type="button"
                  onClick={clearForm}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-all"
                >
                  重置
                </button>
              </div>
            </form>
          </div>

          {/* Result Presentation */}
          {calculated.isValid && (
            <div className="bg-white p-6 rounded-xl border-2 border-brand-500 shadow-sm animate-fade-in space-y-4">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <h4 className="font-bold text-gray-800 text-base">实时计算结果 (不作任何数值修约)</h4>
                  <p className="text-xs text-gray-400 mt-0.5">根据 Math.PI 高精度计算，完整展示计算值</p>
                </div>
                <span className="px-2.5 py-0.5 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">计算成功</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-400 block">井管水深 h</span>
                  <span className="text-lg font-mono font-bold text-gray-700">
                    {calculated.h} <span className="text-xs font-normal text-gray-500">cm</span>
                  </span>
                  {depthUnit === 'm' && (
                    <span className="text-xs text-gray-400 block mt-1">
                      (由 {wellDepth}m - {buryDepth}m = {(parseFloat(wellDepth) - parseFloat(buryDepth))}m 换算而来)
                    </span>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-400 block">井管内水体积 V₁</span>
                  <span className="text-sm font-mono font-medium text-gray-600 break-all">
                    {calculated.v1} <span className="text-xs font-normal text-gray-500">ml</span>
                  </span>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-400 block">填料层孔隙水体积 V₂</span>
                  <span className="text-sm font-mono font-medium text-gray-600 break-all">
                    {calculated.v2} <span className="text-xs font-normal text-gray-500">ml</span>
                  </span>
                </div>

                <div className="bg-brand-50 p-3 rounded-lg border border-brand-100">
                  <span className="text-xs text-brand-600 block font-medium">推荐至少洗井水量 (3倍体积)</span>
                  <span className="text-lg font-mono font-bold text-brand-700 break-all">
                    {calculated.vWash} <span className="text-xs font-normal">ml</span>
                  </span>
                  <span className="text-xs text-brand-500 block mt-1 font-mono">
                    ≈ {(calculated.vWash / 1000).toFixed(6)} L
                  </span>
                </div>
              </div>

              {/* Main volume result */}
              <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-4 rounded-lg text-white">
                <span className="text-xs text-brand-100 block">总井水体积 V</span>
                <span className="text-2xl md:text-3xl font-mono font-bold block select-all break-all leading-tight">
                  {calculated.vTotal} <span className="text-lg font-normal">ml</span>
                </span>
                <span className="text-xs text-brand-100 block mt-1 font-mono">
                  ≈ {(calculated.vTotal / 1000).toFixed(6)} L
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Calculation History */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              历史记录
            </h3>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5" /> 清空
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-100 rounded-lg">
              <ClockIcon className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">暂无计算记录</p>
              <p className="text-xs text-gray-300 mt-1">填写左侧参数并点击记录，即可保存计算历史</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[500px] flex-1 pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-lg border border-gray-100 relative group transition-all"
                >
                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="删除记录"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-xs text-gray-400 font-mono mb-1.5">{item.timestamp}</div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      井管 d<sub>c</sub>: <span className="font-mono font-medium text-gray-800">{item.dc} cm</span>, 
                      钻孔 d<sub>b</sub>: <span className="font-mono font-medium text-gray-800">{item.db} cm</span>
                    </div>
                    <div>
                      井深: <span className="font-mono font-medium text-gray-800">{item.wellDepth} {item.depthUnit}</span>, 
                      埋深: <span className="font-mono font-medium text-gray-800">{item.buryDepth} {item.depthUnit}</span>
                    </div>
                    <div className="border-t border-gray-200/60 my-1 pt-1 font-semibold text-brand-700">
                      V: <span className="font-mono text-gray-900 break-all text-xs font-bold block mt-0.5">{item.vTotal} ml</span>
                    </div>
                    <div className="text-brand-600">
                      3V: <span className="font-mono text-gray-900 break-all text-xs block mt-0.5">{item.vWash} ml</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WellVolumeTool;
