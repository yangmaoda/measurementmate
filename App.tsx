import React, { useState } from 'react';
import ComparisonTool from './components/ComparisonTool';
import ConversionTool from './components/ConversionTool';
import CalibrationTool from './components/CalibrationTool';
import StandaloneOCR from './components/StandaloneOCR';
import { 
  ClipboardDocumentCheckIcon, 
  CalculatorIcon, 
  PhotoIcon,
  Bars3Icon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

type Tab = 'comparison' | 'conversion' | 'calibration' | 'ocr';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('comparison');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'comparison': return <ComparisonTool />;
      case 'conversion': return <ConversionTool />;
      case 'calibration': return <CalibrationTool />;
      case 'ocr': return <StandaloneOCR />;
      default: return <ComparisonTool />;
    }
  };

  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: 'comparison', label: '测量比对', icon: ClipboardDocumentCheckIcon },
    { id: 'conversion', label: '计算工具', icon: CalculatorIcon },
    { id: 'calibration', label: '校准', icon: WrenchScrewdriverIcon },
    { id: 'ocr', label: '独立 OCR', icon: PhotoIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 font-sans text-gray-800">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center z-20 relative">
        <h1 className="text-lg font-bold text-brand-700 flex items-center gap-2">
           <ClipboardDocumentCheckIcon className="w-6 h-6" /> MeasurementMate
        </h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Bars3Icon className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white shadow-lg z-10 border-b border-gray-200">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
           <h1 className="text-xl font-bold text-brand-700 flex items-center gap-2">
             <ClipboardDocumentCheckIcon className="w-7 h-7" /> Measurement
           </h1>
           <span className="text-xs text-gray-400 pl-9">Professional Tool</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-brand-50 text-brand-700 font-medium shadow-sm border border-brand-100' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-brand-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-center text-gray-400">© 2024 MeasurementMate</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen-calc md:h-screen">
        <header className="mb-8">
           <h2 className="text-2xl font-bold text-gray-800">
             {navItems.find(n => n.id === activeTab)?.label}
           </h2>
           <p className="text-gray-500 text-sm mt-1">
             {activeTab === 'comparison' && '在线数据与手工数据比对与合规性判定'}
             {activeTab === 'conversion' && '气体参数折算与数值修约工具'}
             {activeTab === 'calibration' && '校准误差与偏差计算工具'}
             {activeTab === 'ocr' && '图片文字识别辅助工具'}
           </p>
        </header>

        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;