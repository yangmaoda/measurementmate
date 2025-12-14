export type ProjectType = 
  | 'so2' 
  | 'no2' 
  | 'flow_rate' 
  | 'temperature' 
  | 'oxygen' 
  | 'humidity' 
  | 'particles' 
  | 'other_gas'
  | 'average_calc';

export const PROJECT_LABELS: Record<ProjectType, string> = {
  so2: '二氧化硫 (SO₂)',
  no2: '氮氧化物 (NOₓ)',
  flow_rate: '烟气流速',
  temperature: '烟气温度',
  oxygen: '含氧量',
  humidity: '含湿量',
  particles: '颗粒物',
  other_gas: '其它气态污染物',
  average_calc: '计算平均数'
};

export interface ComparisonResult {
  onlineAverage: number;
  personalValue: number;
  error: number;
  isRelative: boolean;
  isQualified: boolean;
  message: string;
  documentReq: string;
  // Optional field for sample count in average calculation mode
  sampleCount?: number;
}

// Global definition for Tesseract attached to window via CDN
declare global {
  interface Window {
    Tesseract: any;
  }
}