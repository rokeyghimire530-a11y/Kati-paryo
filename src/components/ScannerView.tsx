import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  ASSETS,
  CategoryItem,
  Language,
  NEPAL_DISTRICTS,
  ProductItem,
  UI_STRINGS,
  formatNpr,
} from '../data/nepalData';
import { ResilientImage } from './ResilientImage';

interface ScannerViewProps {
  lang: Language;
  selectedDistrict: string;
  categories: CategoryItem[];
  onAddScannedProductToCatalog: (product: ProductItem) => Promise<void>;
  onSaveReceiptRecord: (receipt: {
    shopName: string;
    district: string;
    billDate: string;
    totalAmount: number;
    itemsCount: number;
    summaryText: string;
  }) => Promise<void>;
  onSelectProduct: (product: ProductItem) => void;
}

interface ScannedProductResult {
  identified: boolean;
  productName: string;
  productNameNe: string;
  brand: string;
  model: string;
  categorySlug: string;
  categoryName: string;
  approximateType: string;
  minPriceNpr: number;
  avgPriceNpr: number;
  maxPriceNpr: number;
  confidence: number;
  verificationNoteNe: string;
  verificationNoteEn: string;
}

interface BillLineItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  categorySlug: string;
}

interface ScannedBillResult {
  shopName: string;
  billDate: string;
  district: string;
  totalAmount: number;
  confidence: number;
  items: BillLineItem[];
}

// Helper to compress image on canvas for fast mobile uploads
async function compressImageDataUrl(dataUrl: string, maxDim = 960): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Generate a realistic sample Nepal retail receipt image on canvas for quick testing
function createSampleNepalBillDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 760;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('BHATBHATENI & NEW ROAD ELECTRONICS MART', 45, 60);
  ctx.font = '16px monospace';
  ctx.fillText('New Road, Kathmandu, Nepal | PAN: 604829103', 45, 92);
  ctx.fillText('Date: 2026-10-02   Bill No: KP-8841', 45, 120);

  ctx.strokeStyle = '#94A3B8';
  ctx.beginPath();
  ctx.moveTo(45, 140);
  ctx.lineTo(595, 140);
  ctx.stroke();

  ctx.font = 'bold 16px monospace';
  ctx.fillText('ITEM                          QTY    RATE (NPR)   AMOUNT', 45, 170);

  ctx.font = '16px monospace';
  const rows = [
    ['1. Baltra 5L Pressure Cooker', '1', '3,300', '3,300'],
    ['2. CG 1.8L Electric Rice Cooker', '1', '2,800', '2,800'],
    ['3. Jira Masino Rice 25kg Sack', '1', '2,350', '2,350'],
    ['4. Studds Thunder D7 Helmet', '1', '4,150', '4,150'],
  ];

  let y = 215;
  for (const [name, qty, rate, amt] of rows) {
    ctx.fillText(name.padEnd(30, ' '), 45, y);
    ctx.fillText(qty, 350, y);
    ctx.fillText(rate, 420, y);
    ctx.fillText(amt, 525, y);
    y += 42;
  }

  ctx.beginPath();
  ctx.moveTo(45, y + 10);
  ctx.lineTo(595, y + 10);
  ctx.stroke();

  ctx.font = 'bold 20px monospace';
  ctx.fillText('GRAND TOTAL (NPR):                  Rs. 12,600', 45, y + 50);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Thank you for shopping in Kathmandu! Goods once sold are exchangeable within 7 days.', 45, y + 100);

  return canvas.toDataURL('image/jpeg', 0.85);
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  lang,
  selectedDistrict,
  categories,
  onAddScannedProductToCatalog,
  onSaveReceiptRecord,
  onSelectProduct,
}) => {
  const t = UI_STRINGS[lang];
  const [scanMode, setScanMode] = useState<'product' | 'bill'>('product');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [hintText, setHintText] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Product scan result & manual override state
  const [productResult, setProductResult] = useState<ScannedProductResult | null>(null);
  const [manualCorrectionMode, setManualCorrectionMode] = useState(false);
  const [editProductName, setEditProductName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCategorySlug, setEditCategorySlug] = useState('mobile-electronics');
  const [editMinPrice, setEditMinPrice] = useState(15000);
  const [editAvgPrice, setEditAvgPrice] = useState(17000);
  const [editMaxPrice, setEditMaxPrice] = useState(19000);

  // Bill scan result & editable items
  const [billResult, setBillResult] = useState<ScannedBillResult | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setErrorMsg(
        lang === 'ne'
          ? 'क्यामेरा खोल्न सकिएन। कृपया फोटो अपलोड गर्नुहोस् वा नमूना फोटो प्रयोग गर्नुहोस्।'
          : 'Camera permission unavailable. Please upload a photo or use a sample photo.'
      );
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    stopCamera();
    setPreviewUrl(dataUrl);
    await executeAiScan(dataUrl, scanMode);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const compressed = await compressImageDataUrl(reader.result);
        setPreviewUrl(compressed);
        await executeAiScan(compressed, scanMode);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSampleScan = async () => {
    setErrorMsg(null);
    setStatusBanner(null);
    if (scanMode === 'product') {
      const compressed = await compressImageDataUrl(ASSETS.phoneImg);
      setPreviewUrl(compressed);
      await executeAiScan(compressed, 'product');
    } else {
      const billDataUrl = createSampleNepalBillDataUrl();
      setPreviewUrl(billDataUrl);
      await executeAiScan(billDataUrl, 'bill');
    }
  };

  const executeAiScan = async (imageDataUrl: string, mode: 'product' | 'bill') => {
    setIsScanning(true);
    setErrorMsg(null);
    setStatusBanner(null);

    try {
      const endpoint = mode === 'product' ? '/api/ai/scan-product' : '/api/ai/scan-bill';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          mimeType: 'image/jpeg',
          hintText: hintText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t.unidentifiedProductMsg);
      }

      if (mode === 'product') {
        const pr = data as ScannedProductResult;
        setProductResult(pr);
        setEditProductName(pr.productName || '');
        setEditBrand(pr.brand || '');
        setEditModel(pr.model || '');
        setEditCategorySlug(pr.categorySlug || 'mobile-electronics');
        setEditMinPrice(Math.max(100, Math.round(pr.minPriceNpr || 10000)));
        setEditAvgPrice(Math.max(100, Math.round(pr.avgPriceNpr || 12000)));
        setEditMaxPrice(Math.max(100, Math.round(pr.maxPriceNpr || 14000)));
        if (!pr.identified || pr.confidence < 35) {
          setManualCorrectionMode(true);
          setErrorMsg(t.unidentifiedProductMsg);
        } else {
          setManualCorrectionMode(false);
        }
      } else {
        const br = data as ScannedBillResult;
        setBillResult(br);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.unidentifiedProductMsg);
      if (mode === 'product') {
        setManualCorrectionMode(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveScannedProduct = async () => {
    const matchedCat =
      categories.find((c) => c.slug === editCategorySlug) || categories[0];
    const newProd: ProductItem = {
      id: `prod_scan_${Date.now()}`,
      name: editProductName.trim() || 'Scanned Nepal Product',
      nameNe: productResult?.productNameNe || editProductName.trim() || 'स्क्यान गरिएको सामान',
      brand: editBrand.trim() || 'Generic',
      model: editModel.trim() || 'Standard',
      categoryId: matchedCat.id,
      categoryName: matchedCat.nameEn,
      imageUrl: previewUrl || ASSETS.phoneImg,
      minPrice: Number(editMinPrice),
      maxPrice: Math.max(Number(editMinPrice), Number(editMaxPrice)),
      avgPrice: Math.min(
        Math.max(Number(editMinPrice), Number(editAvgPrice)),
        Math.max(Number(editMinPrice), Number(editMaxPrice))
      ),
      priceSource: 'Estimated',
      confidenceScore: productResult?.confidence || 75,
      district: selectedDistrict,
      featured: false,
      sponsored: false,
      visibility: 'public',
      createdBy: 'scanner_user',
      updatedAtLabel: '2026-10-02',
      hasSufficientRecentData: true,
    };

    await onAddScannedProductToCatalog(newProd);
    setStatusBanner(
      lang === 'ne'
        ? 'सामान सफलतापूर्वक सूचीमा थपियो! अब विस्तृत मूल्य विवरण हेर्नुहोस्।'
        : 'Product added to catalog! Opening product price page...'
    );
    setTimeout(() => {
      onSelectProduct(newProd);
    }, 600);
  };

  const handleUpdateBillItem = (index: number, field: keyof BillLineItem, value: string | number) => {
    if (!billResult) return;
    const updatedItems = [...billResult.items];
    const item = { ...updatedItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.lineTotal = Math.round(Number(item.quantity) * Number(item.unitPrice));
    }
    updatedItems[index] = item;
    const newTotal = updatedItems.reduce((acc, row) => acc + Number(row.lineTotal || 0), 0);
    setBillResult({
      ...billResult,
      items: updatedItems,
      totalAmount: newTotal,
    });
  };

  const handleAddBillRow = () => {
    if (!billResult) return;
    setBillResult({
      ...billResult,
      items: [
        ...billResult.items,
        {
          productName: 'New Item',
          quantity: 1,
          unitPrice: 500,
          lineTotal: 500,
          categorySlug: 'grocery',
        },
      ],
      totalAmount: billResult.totalAmount + 500,
    });
  };

  const handleRemoveBillRow = (index: number) => {
    if (!billResult) return;
    const updatedItems = billResult.items.filter((_, i) => i !== index);
    const newTotal = updatedItems.reduce((acc, row) => acc + Number(row.lineTotal || 0), 0);
    setBillResult({
      ...billResult,
      items: updatedItems,
      totalAmount: newTotal,
    });
  };

  const handleSaveReceipt = async () => {
    if (!billResult) return;
    const summaryText = billResult.items
      .map((i) => `${i.productName} (${i.quantity} x Rs.${i.unitPrice} = Rs.${i.lineTotal})`)
      .join('; ');
    await onSaveReceiptRecord({
      shopName: billResult.shopName || 'Nepal Store',
      district: billResult.district || selectedDistrict,
      billDate: billResult.billDate || '2026-10-02',
      totalAmount: billResult.totalAmount,
      itemsCount: billResult.items.length || 1,
      summaryText: summaryText || 'Scanned Bill',
    });
    setStatusBanner(
      lang === 'ne'
        ? 'बिलको विवरण सफलतापूर्वक सुरक्षित गरियो!'
        : 'Extracted bill details saved to your account!'
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {scanMode === 'product'
              ? lang === 'ne'
                ? 'एआई सामान स्क्यानर (AI Product Scanner)'
                : 'AI Product Scanner'
              : lang === 'ne'
              ? 'बिल / रसिद स्क्यानर (AI Bill Scanner)'
              : 'AI Receipt & Bill Scanner'}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {scanMode === 'product'
              ? lang === 'ne'
                ? 'सामानको फोटो खिच्नुहोस् वा अपलोड गरी नेपालको अनुमानित बजार मूल्य थाहा पाउनुहोस्।'
                : 'Take or upload a product photo to identify brand, model, and estimated Nepal price range.'
              : lang === 'ne'
              ? 'पसलको बिल अपलोड गरी सामानको नाम, परिमाण र मूल्य स्वतः निकाल्नुहोस्।'
              : 'Upload a store receipt to extract product names, quantities, individual prices, and total.'}
          </p>
        </div>

        {/* Interactive Mode Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl self-start">
          <button
            type="button"
            onClick={() => {
              setScanMode('product');
              setErrorMsg(null);
              setStatusBanner(null);
            }}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              scanMode === 'product'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'ne' ? 'सामान स्क्यान' : 'Product Scan'}
          </button>
          <button
            type="button"
            onClick={() => {
              setScanMode('bill');
              setErrorMsg(null);
              setStatusBanner(null);
            }}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              scanMode === 'bill'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'ne' ? 'बिल स्क्यान' : 'Bill Scanner'}
          </button>
        </div>
      </div>

      {/* Capture / Upload Surface */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
        {scanMode === 'product' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              {lang === 'ne'
                ? 'ऐच्छिक जानकारी (जस्तै: ब्रान्ड वा मोडेल थाहा भए लेख्नुहोस्)'
                : 'Optional hint (e.g., brand or model if partially visible)'}
            </label>
            <input
              type="text"
              value={hintText}
              onChange={(e) => setHintText(e.target.value)}
              placeholder={
                lang === 'ne'
                  ? 'उदा: Redmi Note 13, Baltra Cooker 5L...'
                  : 'e.g., Redmi Note 13, Baltra Pressure Cooker...'
              }
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
            />
          </div>
        )}

        {cameraActive ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={captureFromCamera}
                className="flex-1 min-h-[46px] bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Camera className="w-4 h-4" />
                <span>{lang === 'ne' ? 'फोटो खिच्नुहोस्' : 'Capture Photo'}</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="min-h-[46px] px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
              >
                {lang === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={startCamera}
              className="min-h-[48px] px-4 py-3 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>{lang === 'ne' ? 'क्यामेरा खोल्नुहोस्' : 'Open Camera'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[48px] px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>{lang === 'ne' ? 'फोटो अपलोड गर्नुहोस्' : 'Upload Photo'}</span>
            </button>

            <button
              type="button"
              onClick={handleSampleScan}
              disabled={isScanning}
              className="min-h-[48px] px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>
                {scanMode === 'product'
                  ? lang === 'ne'
                    ? 'नमूना सामान स्क्यान'
                    : 'Try Sample Product'
                  : lang === 'ne'
                  ? 'नमूना बिल स्क्यान'
                  : 'Try Sample Bill'}
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Preview & Loading */}
        {previewUrl && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-28 h-28 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
              <ResilientImage src={previewUrl} alt="Scanned preview" />
            </div>
            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <p className="text-xs text-slate-500">
                {lang === 'ne' ? 'स्क्यान गरिएको तस्बिर' : 'Uploaded Image Preview'}
              </p>
              {isScanning ? (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-semibold text-red-700">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    {lang === 'ne'
                      ? 'Gemini AI ले सामान र नेपाल बजार मूल्य विश्लेषण गर्दैछ...'
                      : 'Analyzing image & estimating Nepal market price...'}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => executeAiScan(previewUrl, scanMode)}
                  className="min-h-[38px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  {t.tryAgainMsg}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Friendly Nepali Error or Status Banner */}
      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">{errorMsg}</p>
            <p className="text-xs text-amber-800">
              {lang === 'ne'
                ? 'तलको फारममा सामानको नाम, ब्रान्ड वा श्रेणी आफैँ सच्याउन सक्नुहुन्छ।'
                : 'You can manually enter or correct the product details in the form below.'}
            </p>
          </div>
        </div>
      )}

      {statusBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-900 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* PRODUCT SCANNER RESULT CARD */}
      {scanMode === 'product' && (productResult || manualCorrectionMode) && !isScanning && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>{t.estimatedLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">
                  {lang === 'ne' ? 'एआई विश्वास स्तर' : 'AI Confidence'}:{' '}
                  {Math.round(productResult?.confidence || 70)}%
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {productResult?.productName || editProductName || 'Product Identification'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setManualCorrectionMode(!manualCorrectionMode)}
              className="min-h-[40px] px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>
                {manualCorrectionMode
                  ? lang === 'ne'
                    ? 'सच्याउने मोड बन्द'
                    : 'Hide Manual Edit'
                  : lang === 'ne'
                  ? 'नाम / ब्रान्ड सच्याउनुहोस्'
                  : 'Manual Correction'}
              </span>
            </button>
          </div>

          {/* Structured Fields Display Required by Brief */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-slate-100 pr-0 sm:pr-4 pb-4 sm:pb-0">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-slate-900 text-right">{editProductName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Brand:</span>
                <span className="font-medium text-slate-900">{editBrand}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Model:</span>
                <span className="font-medium text-slate-900">{editModel}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Category:</span>
                <span className="font-medium text-slate-900">
                  {categories.find((c) => c.slug === editCategorySlug)?.nameEn ||
                    productResult?.categoryName ||
                    'Mobile & Electronics'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Estimated Nepal Price:</span>
                <span className="font-bold text-red-700 font-mono-num">
                  {formatNpr(editMinPrice)} – {formatNpr(editMaxPrice)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Minimum Price:</span>
                <span className="font-medium text-slate-900 font-mono-num">
                  {formatNpr(editMinPrice)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Average Price:</span>
                <span className="font-semibold text-slate-900 font-mono-num">
                  {formatNpr(editAvgPrice)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Maximum Price:</span>
                <span className="font-medium text-slate-900 font-mono-num">
                  {formatNpr(editMaxPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Manual Correction Form */}
          {manualCorrectionMode && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {lang === 'ne'
                  ? 'सामानको विवरण सच्याउनुहोस् (Manual Correction)'
                  : 'Manually Correct Product & Estimated Price'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Model</label>
                  <input
                    type="text"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Category</label>
                  <select
                    value={editCategorySlug}
                    onChange={(e) => setEditCategorySlug(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.nameNe} ({c.nameEn})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Min Price (NPR)</label>
                  <input
                    type="number"
                    value={editMinPrice}
                    onChange={(e) => setEditMinPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Avg Price (NPR)</label>
                  <input
                    type="number"
                    value={editAvgPrice}
                    onChange={(e) => setEditAvgPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mandatory Verification Notice */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <p className="font-medium text-slate-900">{t.verifyDisclaimer}</p>
            {productResult && (
              <p>
                {lang === 'ne' ? productResult.verificationNoteNe : productResult.verificationNoteEn}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveScannedProduct}
              className="min-h-[44px] px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              {lang === 'ne'
                ? 'पसलको मूल्य तुलना र विवरणमा जानुहोस्'
                : 'Save & Compare Seller Prices'}
            </button>
          </div>
        </div>
      )}

      {/* BILL SCANNER RESULT & EDITABLE TABLE */}
      {scanMode === 'bill' && billResult && !isScanning && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs text-slate-500">
                <span>AI OCR Bill Extraction</span>
                <span aria-hidden="true"> · </span>
                <span className="font-mono-num">
                  Confidence: {Math.round(billResult.confidence || 90)}%
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {lang === 'ne'
                  ? 'बिलबाट निकालिएको विवरण (सच्याउन सकिने)'
                  : 'Extracted Receipt Details (Editable)'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddBillRow}
              className="min-h-[40px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ne' ? 'सामान थप्नुहोस्' : 'Add Row'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {lang === 'ne' ? 'पसलको नाम (Shop Name)' : 'Shop Name'}
              </label>
              <input
                type="text"
                value={billResult.shopName}
                onChange={(e) => setBillResult({ ...billResult, shopName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {lang === 'ne' ? 'मिति (Bill Date)' : 'Bill Date'}
              </label>
              <input
                type="text"
                value={billResult.billDate}
                onChange={(e) => setBillResult({ ...billResult, billDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {lang === 'ne' ? 'जिल्ला / सहर (Location)' : 'District / City'}
              </label>
              <select
                value={billResult.district}
                onChange={(e) => setBillResult({ ...billResult, district: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                {NEPAL_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameNe} ({d.nameEn})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Editable Extracted Items */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-2 font-medium">Product Name</th>
                  <th className="py-2 px-2 font-medium w-20">Qty</th>
                  <th className="py-2 px-2 font-medium w-28">Unit Price (Rs.)</th>
                  <th className="py-2 px-2 font-medium w-28 text-right">Line Total</th>
                  <th className="py-2 pl-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billResult.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleUpdateBillItem(idx, 'productName', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateBillItem(idx, 'quantity', Math.max(1, Number(e.target.value)))
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono-num"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleUpdateBillItem(idx, 'unitPrice', Math.max(0, Number(e.target.value)))
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono-num"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono-num font-semibold text-slate-900">
                      {formatNpr(item.lineTotal)}
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveBillRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200">
            <div className="text-base font-bold text-slate-900 font-mono-num">
              {lang === 'ne' ? 'जम्मा बिल रकम (Total): ' : 'Total Extracted Amount: '}
              <span className="text-red-700">{formatNpr(billResult.totalAmount)}</span>
            </div>

            <button
              type="button"
              onClick={handleSaveReceipt}
              className="min-h-[44px] px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              {lang === 'ne' ? 'बिल विवरण सेभ गर्नुहोस्' : 'Save Verified Receipt'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
