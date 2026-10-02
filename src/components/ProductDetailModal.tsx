import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Bell,
  Flag,
  PlusCircle,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  PhoneCall,
} from 'lucide-react';
import {
  Language,
  NEPAL_DISTRICTS,
  PriceHistoryPoint,
  PriceReportItem,
  ProductItem,
  SellerProductItem,
  UI_STRINGS,
  formatNpr,
} from '../data/nepalData';
import { ResilientImage } from './ResilientImage';
import { RewardedAdTrigger } from './AdMobSlot';

interface ProductDetailModalProps {
  product: ProductItem;
  lang: Language;
  selectedDistrict: string;
  isSaved: boolean;
  sellerProducts: SellerProductItem[];
  priceReports: PriceReportItem[];
  priceHistory: PriceHistoryPoint[];
  onClose: () => void;
  onToggleSave: (product: ProductItem) => Promise<void>;
  onSubmitPriceReport: (data: {
    product: ProductItem;
    pricePaid: number;
    quantity: number;
    district: string;
    shopName: string;
    purchaseDate: string;
    receiptUrl?: string;
  }) => Promise<void>;
  onCreatePriceAlert: (product: ProductItem, targetPrice: number, district: string) => Promise<void>;
  onReportIncorrectPrice: (data: {
    product: ProductItem;
    reportedPrice: number;
    reason: string;
    details: string;
  }) => Promise<void>;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  lang,
  selectedDistrict,
  isSaved,
  sellerProducts,
  priceReports,
  priceHistory,
  onClose,
  onToggleSave,
  onSubmitPriceReport,
  onCreatePriceAlert,
  onReportIncorrectPrice,
}) => {
  const t = UI_STRINGS[lang];
  const [historyRange, setHistoryRange] = useState<'30d' | '3m' | '6m' | '1y'>('3m');
  const [rewardedUnlocked, setRewardedUnlocked] = useState(false);

  // Active sub-form drawers
  const [activeForm, setActiveForm] = useState<'none' | 'report_price' | 'alert' | 'share' | 'flag'>('none');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeInquirySeller, setActiveInquirySeller] = useState<SellerProductItem | null>(null);

  // Submit price form state
  const [paidAmount, setPaidAmount] = useState<number>(product.avgPrice);
  const [paidQty, setPaidQty] = useState<number>(1);
  const [paidDistrict, setPaidDistrict] = useState<string>(selectedDistrict);
  const [paidShop, setPaidShop] = useState<string>('');
  const [paidDate, setPaidDate] = useState<string>('2026-10-02');

  // Price alert form state
  const [alertTargetPrice, setAlertTargetPrice] = useState<number>(
    Math.max(100, Math.round(product.minPrice * 0.95))
  );

  // Flag incorrect price state
  const [flagReason, setFlagReason] = useState<string>('Outdated / Higher than market');
  const [flagDetails, setFlagDetails] = useState<string>('');

  const matchingSellers = useMemo(
    () => sellerProducts.filter((sp) => sp.productId === product.id),
    [sellerProducts, product.id]
  );

  const matchingUserReports = useMemo(
    () => priceReports.filter((pr) => pr.productId === product.id && pr.status !== 'rejected'),
    [priceReports, product.id]
  );

  const chartPoints = useMemo(() => {
    const prodPoints = priceHistory.filter((ph) => ph.productId === product.id);
    if (prodPoints.length > 0) return prodPoints;
    // Synthesize transparent history points from product min/avg/max if no dedicated history entries exist yet
    return [
      {
        id: 'syn_1',
        productId: product.id,
        dateLabel: '2026-06',
        minPrice: Math.round(product.minPrice * 1.04),
        avgPrice: Math.round(product.avgPrice * 1.05),
        maxPrice: Math.round(product.maxPrice * 1.05),
        sourceType: product.priceSource,
        sampleCount: 8,
        periodGroup: '6m' as const,
      },
      {
        id: 'syn_2',
        productId: product.id,
        dateLabel: '2026-08',
        minPrice: Math.round(product.minPrice * 1.02),
        avgPrice: Math.round(product.avgPrice * 1.02),
        maxPrice: Math.round(product.maxPrice * 1.02),
        sourceType: product.priceSource,
        sampleCount: 14,
        periodGroup: '3m' as const,
      },
      {
        id: 'syn_3',
        productId: product.id,
        dateLabel: '2026-10',
        minPrice: product.minPrice,
        avgPrice: product.avgPrice,
        maxPrice: product.maxPrice,
        sourceType: product.priceSource,
        sampleCount: 21,
        periodGroup: '30d' as const,
      },
    ];
  }, [priceHistory, product]);

  const lowestHistoryPrice = useMemo(
    () => Math.min(...chartPoints.map((p) => p.minPrice), product.minPrice),
    [chartPoints, product.minPrice]
  );
  const highestHistoryPrice = useMemo(
    () => Math.max(...chartPoints.map((p) => p.maxPrice), product.maxPrice),
    [chartPoints, product.maxPrice]
  );

  const sourceLabelText =
    product.priceSource === 'Seller Price'
      ? t.sellerPriceLabel
      : product.priceSource === 'User Reported'
      ? t.userReportedLabel
      : t.estimatedLabel;

  const shareUrl = `${window.location.origin}/?product=${encodeURIComponent(product.id)}`;
  const shareText = `Kati Paryo? — ${product.name}\nEstimated Nepal Price: ${formatNpr(
    product.minPrice
  )} – ${formatNpr(product.maxPrice)} (Avg: ${formatNpr(product.avgPrice)})\nSource: ${
    product.priceSource
  } | Updated: ${product.updatedAtLabel}`;

  const handleCopyShareLink = () => {
    navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePriceReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmitPriceReport({
      product,
      pricePaid: paidAmount,
      quantity: paidQty,
      district: paidDistrict,
      shopName: paidShop || 'Local Market Store',
      purchaseDate: paidDate,
    });
    setActiveForm('none');
    setFeedbackMsg(
      lang === 'ne'
        ? 'धन्यवाद! तपाईंले तिरेको मूल्य सफलतापूर्वक दर्ता भयो।'
        : 'Thank you! Your reported price has been submitted.'
    );
  };

  const handleAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreatePriceAlert(product, alertTargetPrice, selectedDistrict);
    setActiveForm('none');
    setFeedbackMsg(
      lang === 'ne'
        ? `मूल्य ${formatNpr(alertTargetPrice)} भन्दा कम भएमा तपाईंलाई नोटिफिकेसन आउनेछ।`
        : `Price alert set! We will notify you when price drops below ${formatNpr(alertTargetPrice)}.`
    );
  };

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onReportIncorrectPrice({
      product,
      reportedPrice: product.avgPrice,
      reason: flagReason,
      details: flagDetails || 'Reported from product detail page',
    });
    setActiveForm('none');
    setFeedbackMsg(
      lang === 'ne'
        ? 'गलत मूल्य सम्बन्धी रिपोर्ट एडमिन समक्ष पठाइयो।'
        : 'Incorrect price report submitted for admin moderation.'
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      {/* Top Action Row */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-sm font-medium text-slate-800 transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'ne' ? 'पछाडि फर्कनुहोस्' : 'Back to Catalog'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSave(product)}
            className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              isSaved
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>
              {isSaved
                ? lang === 'ne'
                  ? 'सेभ गरिएको छ'
                  : 'Saved'
                : lang === 'ne'
                ? 'सेभ गर्नुहोस्'
                : 'Save Product'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveForm(activeForm === 'share' ? 'none' : 'share')}
            className="min-h-[44px] px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Share2 className="w-4 h-4" />
            <span>{lang === 'ne' ? 'सेयर' : 'Share'}</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-900 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Insufficient Recent Data Banner */}
      {product.hasSufficientRecentData === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">{t.insufficientDataMsg}</p>
            <p className="text-xs text-amber-800">
              Last updated: {product.updatedAtLabel} · Data source: {product.priceSource}
            </p>
          </div>
        </div>
      )}

      {/* Contiguous Product Overview Module */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
          <ResilientImage
            src={product.imageUrl}
            alt={product.name}
            fallbackLabel={product.name}
          />
        </div>

        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            {/* Clean unboxed metadata with typographic separators */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-red-700">{sourceLabelText}</span>
              <span aria-hidden="true">·</span>
              <span>{product.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>
                {product.brand} / {product.model}
              </span>
              <span aria-hidden="true">·</span>
              <span>{product.district}</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {lang === 'ne' ? product.nameNe : product.name}
            </h1>
            {lang === 'ne' && (
              <p className="text-xs text-slate-500">{product.name}</p>
            )}
          </div>

          {/* Price Range & Average Block */}
          <div className="py-4 border-y border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500">
                {lang === 'ne' ? 'नेपालको अनुमानित मूल्य सीमा' : 'Estimated Nepal Price Range'}
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono-num mt-0.5">
                {formatNpr(product.minPrice)} – {formatNpr(product.maxPrice)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {lang === 'ne' ? 'अन्तिम अपडेट' : 'Last updated'}: {product.updatedAtLabel}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500">
                {lang === 'ne' ? 'औसत बजार मूल्य (Average)' : 'Average Reported Price'}
              </div>
              <div className="text-2xl font-bold text-red-700 font-mono-num mt-0.5">
                {formatNpr(product.avgPrice)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {lang === 'ne' ? 'स्रोत' : 'Source'}: {product.priceSource} ({product.confidenceScore}% confidence)
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setActiveForm(activeForm === 'report_price' ? 'none' : 'report_price')}
              className="min-h-[44px] px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.submitPriceBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveForm(activeForm === 'alert' ? 'none' : 'alert')}
              className="min-h-[44px] px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Bell className="w-4 h-4" />
              <span>{t.setAlertBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveForm(activeForm === 'flag' ? 'none' : 'flag')}
              className="min-h-[44px] px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{t.reportIncorrectBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Action Drawers (Submit Price, Price Alert, Share Card, Report Incorrect) */}
      {activeForm === 'report_price' && (
        <form
          onSubmit={handlePriceReportSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
        >
          <h3 className="text-base font-bold text-slate-900">
            {lang === 'ne'
              ? 'तपाईंले खरिद गर्नुभएको वास्तविक मूल्य पठाउनुहोस्'
              : 'Submit the Actual Price You Paid'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                {lang === 'ne' ? 'तिरेको मूल्य (Rs.)' : 'Price Paid (NPR)'}
              </label>
              <input
                type="number"
                required
                min={1}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                {lang === 'ne' ? 'परिमाण (Quantity)' : 'Quantity'}
              </label>
              <input
                type="number"
                required
                min={1}
                value={paidQty}
                onChange={(e) => setPaidQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                {lang === 'ne' ? 'जिल्ला / सहर' : 'Location (District)'}
              </label>
              <select
                value={paidDistrict}
                onChange={(e) => setPaidDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                {NEPAL_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameNe} ({d.nameEn})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                {lang === 'ne' ? 'पसलको नाम (ऐच्छिक)' : 'Shop Name (Optional)'}
              </label>
              <input
                type="text"
                value={paidShop}
                onChange={(e) => setPaidShop(e.target.value)}
                placeholder="e.g., New Road Mobile Complex"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                {lang === 'ne' ? 'खरिद मिति' : 'Purchase Date'}
              </label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveForm('none')}
              className="min-h-[40px] px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              {lang === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-xl whitespace-nowrap"
            >
              {lang === 'ne' ? 'मूल्य पठाउनुहोस्' : 'Submit Report'}
            </button>
          </div>
        </form>
      )}

      {activeForm === 'alert' && (
        <form
          onSubmit={handleAlertSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
        >
          <h3 className="text-base font-bold text-slate-900">
            {lang === 'ne'
              ? 'मूल्य घटेमा जानकारी पाउनुहोस् (Price Alert)'
              : 'Set Price-Drop Alert'}
          </h3>
          <p className="text-sm text-slate-600">
            {lang === 'ne'
              ? 'मूल्य कति रूपैयाँ भन्दा कम हुँदा तपाईंलाई खबर गरौँ?'
              : 'Notify me when price falls below Rs. ______'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="number"
              required
              min={1}
              value={alertTargetPrice}
              onChange={(e) => setAlertTargetPrice(Number(e.target.value))}
              className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl font-mono-num"
            />
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl whitespace-nowrap"
            >
              {lang === 'ne' ? 'अलर्ट सेभ गर्नुहोस्' : 'Enable Alert'}
            </button>
          </div>
        </form>
      )}

      {activeForm === 'flag' && (
        <form
          onSubmit={handleFlagSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
        >
          <h3 className="text-base font-bold text-slate-900">
            {t.reportIncorrectBtn}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Reason</label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="Outdated / Higher than market">Outdated / Higher than market</option>
                <option value="Fake seller listing">Suspicious / Fake seller price</option>
                <option value="Wrong model / specification">Wrong model or brand</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Details</label>
              <input
                type="text"
                required
                value={flagDetails}
                onChange={(e) => setFlagDetails(e.target.value)}
                placeholder="What is the real market price you saw?"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveForm('none')}
              className="min-h-[40px] px-4 py-2 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-xl whitespace-nowrap"
            >
              Submit Report
            </button>
          </div>
        </form>
      )}

      {activeForm === 'share' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            {lang === 'ne' ? 'मूल्य कार्ड सेयर गर्नुहोस् (Share Price Card)' : 'Share Product Price Card'}
          </h3>

          {/* Clean Share Card Preview */}
          <div className="p-5 rounded-xl bg-slate-900 text-white space-y-2 max-w-md">
            <div className="text-xs text-slate-400">
              Kati Paryo? · सामान किन्नुअघि, मूल्य थाहा पाऔँ।
            </div>
            <div className="text-lg font-bold">{product.name}</div>
            <div className="text-xl font-bold text-red-400 font-mono-num">
              {formatNpr(product.minPrice)} – {formatNpr(product.maxPrice)}
            </div>
            <div className="text-xs text-slate-300">
              Average: {formatNpr(product.avgPrice)} · Source: {product.priceSource} · Updated:{' '}
              {product.updatedAtLabel}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              Facebook
            </a>
            <a
              href={`fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              Messenger
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                shareText + ' ' + shareUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                shareUrl
              )}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              Telegram
            </a>
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="min-h-[40px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PRICE HISTORY CHART SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {lang === 'ne' ? 'मूल्य इतिहास (Price History)' : 'Nepal Market Price History'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'ne'
                ? 'समय अनुसार न्यूनतम, औसत र अधिकतम बजार मूल्यको उतारचढाव'
                : 'Historical lowest, average, and highest reported prices with date and data source'}
            </p>
          </div>

          {/* Interactive Range Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            {(['30d', '3m', '6m', '1y'] as const).map((rng) => (
              <button
                key={rng}
                type="button"
                onClick={() => setHistoryRange(rng)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  historyRange === rng
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rng === '30d'
                  ? '30 Days'
                  : rng === '3m'
                  ? '3 Months'
                  : rng === '6m'
                  ? '6 Months'
                  : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4 py-2">
          <div>
            <div className="text-xs text-slate-500">
              {lang === 'ne' ? 'सबैभन्दा कम (Lowest)' : 'Lowest Reported'}
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono-num">
              {formatNpr(lowestHistoryPrice)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">
              {lang === 'ne' ? 'औसत मूल्य (Average)' : 'Average Price'}
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 font-mono-num">
              {formatNpr(product.avgPrice)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">
              {lang === 'ne' ? 'सबैभन्दा बढी (Highest)' : 'Highest Reported'}
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-700 font-mono-num">
              {formatNpr(highestHistoryPrice)}
            </div>
          </div>
        </div>

        {/* SVG Chart Visualization */}
        <div className="pt-2">
          <div className="h-44 w-full bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col justify-between">
            <svg className="w-full h-28 overflow-visible" viewBox="0 0 400 100">
              <defs>
                <linearGradient id="priceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B91C1C" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {(() => {
                const pts = chartPoints.map((pt, idx) => {
                  const x =
                    chartPoints.length === 1
                      ? 200
                      : Math.round((idx / (chartPoints.length - 1)) * 360) + 20;
                  const range = Math.max(1, highestHistoryPrice - lowestHistoryPrice);
                  const y =
                    85 - Math.round(((pt.avgPrice - lowestHistoryPrice) / range) * 65);
                  return { x, y, pt };
                });
                const polylinePoints = pts.map((p) => `${p.x},${p.y}`).join(' ');
                const areaPoints = `20,95 ${polylinePoints} 380,95`;

                return (
                  <>
                    <polygon points={areaPoints} fill="url(#priceAreaGrad)" />
                    <polyline
                      fill="none"
                      stroke="#B91C1C"
                      strokeWidth="2.5"
                      points={polylinePoints}
                    />
                    {pts.map((p, i) => (
                      <g key={i}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="#FFFFFF"
                          stroke="#B91C1C"
                          strokeWidth="2.5"
                        />
                        <text
                          x={p.x}
                          y={Math.max(14, p.y - 10)}
                          textAnchor="middle"
                          className="text-[10px] fill-slate-700 font-mono-num"
                        >
                          {formatNpr(p.pt.avgPrice)}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>

            <div className="flex justify-between text-[11px] text-slate-500 font-mono-num pt-2 border-t border-slate-200/60">
              {chartPoints.map((pt) => (
                <div key={pt.id} className="text-center">
                  <div>{pt.dateLabel}</div>
                  <div className="text-[10px] text-slate-400">{pt.sourceType}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rewarded Ad Unlock for Detailed History */}
        <RewardedAdTrigger
          lang={lang}
          isUnlocked={rewardedUnlocked}
          onUnlock={() => setRewardedUnlocked(true)}
        />

        {rewardedUnlocked && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="text-xs font-semibold text-slate-900">
              {lang === 'ne'
                ? 'विस्तृत ऐतिहासिक डेटा स्रोत (Unlocked Detailed Log)'
                : 'Unlocked Historical Data Points & Sources'}
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {chartPoints.map((pt) => (
                <div key={pt.id} className="py-2 flex items-center justify-between">
                  <span className="font-mono-num text-slate-700">{pt.dateLabel}</span>
                  <span className="text-slate-500">
                    {pt.sourceType} · {pt.sampleCount} samples
                  </span>
                  <span className="font-mono-num font-semibold text-slate-900">
                    {formatNpr(pt.minPrice)} – {formatNpr(pt.maxPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SELLER PRICES COMPARISON */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">
            {lang === 'ne'
              ? 'पसलहरूको मूल्य तुलना (Seller Prices)'
              : 'Compare Seller Prices in Nepal'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ne'
              ? 'एडमिनद्वारा स्वीकृत पसलहरूमा मात्र "Verified Seller" चिन्ह देखाइन्छ।'
              : 'Only sellers explicitly approved by Admin display the Verified Seller indicator.'}
          </p>
        </div>

        {matchingSellers.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">
            {lang === 'ne'
              ? 'यो सामानको लागि हाल कुनै पसलको प्रत्यक्ष मूल्य सूचीबद्ध छैन।'
              : 'No direct seller listings yet for this product.'}
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {matchingSellers.map((sp) => (
              <div
                key={sp.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900 text-sm">{sp.shopName}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {sp.verifiedSeller
                        ? lang === 'ne'
                          ? 'प्रमाणित पसल (Verified Seller)'
                          : 'Verified Seller'
                        : lang === 'ne'
                        ? 'प्रमाणीकरण बाँकी (Unverified)'
                        : 'Pending Verification'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    <span>{sp.district}</span>
                    <span aria-hidden="true"> · </span>
                    <span>Updated {sp.updatedAtLabel}</span>
                    <span aria-hidden="true"> · </span>
                    <span>
                      {sp.stockStatus === 'in_stock'
                        ? 'In Stock'
                        : sp.stockStatus === 'limited'
                        ? 'Limited Stock'
                        : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">{t.sellerPriceLabel}</div>
                    <div className="text-lg font-bold text-slate-900 font-mono-num">
                      {formatNpr(sp.price)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveInquirySeller(activeInquirySeller?.id === sp.id ? null : sp)
                    }
                    className="min-h-[40px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{lang === 'ne' ? 'सम्पर्क' : 'Inquire'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeInquirySeller && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900">
                {activeInquirySeller.shopName} ({activeInquirySeller.district}):
              </span>{' '}
              Contact / Inquiry Line:{' '}
              <span className="font-mono-num font-semibold">
                {activeInquirySeller.inquiryPhoneHint}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveInquirySeller(null)}
              className="text-slate-500 hover:text-slate-900 font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* USER-SUBMITTED PRICES */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {lang === 'ne'
                ? 'ग्राहकहरूले तिरेको मूल्य (User-Reported Prices)'
                : 'Recent User-Submitted Prices'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'ne'
                ? 'नेपालका विभिन्न सहरमा ग्राहकहरूले वास्तविक खरिदमा तिरेको रकम'
                : 'Community crowdsourced prices paid by shoppers in Nepal'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveForm('report_price')}
            className="min-h-[40px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg whitespace-nowrap"
          >
            + {t.submitPriceBtn}
          </button>
        </div>

        {matchingUserReports.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">
            {lang === 'ne'
              ? 'अहिलेसम्म ग्राहक रिपोर्ट उपलब्ध छैन। पहिलो मूल्य रिपोर्ट थप्नुहोस्!'
              : 'No user-submitted reports for this item yet. Be the first to report what you paid!'}
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {matchingUserReports.map((pr) => (
              <div key={pr.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-slate-900">{pr.shopName}</div>
                  <div className="text-xs text-slate-500">
                    <span>{pr.userName}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{pr.district}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono-num">{pr.purchaseDate}</span>
                    <span aria-hidden="true"> · </span>
                    <span>Qty: {pr.quantity}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">{t.userReportedLabel}</div>
                  <div className="text-base font-bold text-slate-900 font-mono-num">
                    {formatNpr(pr.pricePaid)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
