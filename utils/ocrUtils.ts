
// Helper to parse numbers from text, handling Chinese punctuation and fixing mis-concatenation
export const parseNumbersFromText = (text: string): number[] => {
  if (!text) return [];

  // 1. 预处理：统一中文标点
  // 将中文逗号和句号转为英文，方便后续统一处理
  const normalized = text.replace(/，/g, ',').replace(/。/g, '.');

  /**
   * 2. 正则表达式优化
   * 旧的正则 /-?\d+(?:[,\s]\d{3})*(?:\.\d+)?/g 会把 "131 131" 匹配为一个整体，因为它试图匹配千分位。
   * 新的正则 /-?\d+(?:[\.,]\d+)?/g 
   * - 匹配可选负号
   * - 匹配连续数字
   * - 可选：匹配一个点或逗号（作为小数点），后接连续数字
   * 这样空格就会自然地成为匹配的终点，从而将数据分开。
   */
  const NUM_RE = /-?\d+(?:[\.,]\d+)?/g;
  
  const hits = normalized.match(NUM_RE) || [];
  
  return hits
    .map((s) => {
      // 兼容 OCR 识别错误：如果数字中间是逗号，通常是把小数点识别错了
      const standardNum = s.replace(',', '.');
      return parseFloat(standardNum);
    })
    .filter((v) => !isNaN(v));
};

// Image preprocessing for better OCR results (Binarization)
export const preprocessImage = (file: File): Promise<HTMLCanvasElement[]> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const minW = 800;
      const scale = Math.max(1, Math.ceil(minW / img.naturalWidth));
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');
      
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, w, h);

      // Create variants: Original
      const variants = [canvas]; 
      
      resolve(variants);
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const createWorker = async (logger: (m: any) => void) => {
  if (!window.Tesseract) throw new Error("Tesseract not loaded");
  return await window.Tesseract.createWorker('eng', 1, { logger });
};
