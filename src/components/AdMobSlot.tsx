import React, { useState } from 'react';
import { ADMOB_CONFIG, Language } from '../data/nepalData';
import { ExternalLink, PlayCircle, X } from 'lucide-react';

interface AdMobBannerProps {
  lang: Language;
  placementName?: string;
  onAdClick?: () => void;
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({
  lang,
  placementName = 'Home Bottom Banner',
  onAdClick,
}) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="my-6 border border-slate-200/80 bg-white rounded-xl p-3.5 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Ad · Google AdMob {ADMOB_CONFIG.isTestMode ? 'Test Mode' : 'Live'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num truncate">{ADMOB_CONFIG.bannerAdUnitId}</span>
        </div>
        <p className="text-sm font-medium text-slate-900 mt-0.5 truncate">
          {lang === 'ne'
            ? 'नेपालभरका प्रमाणित पसलहरूको मूल्य तुलना गर्नुहोस् — Kati Paryo? Sponsored'
            : `Compare verified shop prices across Nepal — ${placementName}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="https://admob.google.com"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onAdClick}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          <span>{lang === 'ne' ? 'हेर्नुहोस्' : 'Learn More'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss advertisement"
          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface AdMobInterstitialModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const AdMobInterstitialModal: React.FC<AdMobInterstitialModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="text-xs text-slate-500">
            <span>Google AdMob Interstitial (Test Ad)</span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono-num">{ADMOB_CONFIG.interstitialAdUnitId}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            {lang === 'ne' ? 'बन्द गर्नुहोस् (Skip)' : 'Close Ad'}
          </button>
        </div>

        <div className="py-6 text-center space-y-3">
          <p className="text-xs text-slate-500">
            {lang === 'ne'
              ? 'यो विज्ञापन प्रत्येक ४ पटकको खोजी पछि मात्र देखाइन्छ'
              : 'Natural Navigation Break — Shown only once every 4 searches'}
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            {lang === 'ne'
              ? 'नेपालका प्रमाणित विक्रेता बन्नुहोस् र आफ्नो पसलको मूल्य सूचीबद्ध गर्नुहोस्'
              : 'Become a Verified Seller on Kati Paryo? Nepal'}
          </h3>
          <p className="text-sm text-slate-600">
            {lang === 'ne'
              ? 'तपाईंको सहरका हजारौँ ग्राहकहरूलाई आफ्नो पसलको सही मूल्य देखाउनुहोस्।'
              : 'Reach shoppers in Kathmandu, Pokhara, Chitwan, Butwal, and across Nepal.'}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
          >
            {lang === 'ne' ? 'खोजी जारी राख्नुहोस्' : 'Continue to Search Results'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface RewardedAdTriggerProps {
  lang: Language;
  isUnlocked: boolean;
  onUnlock: () => void;
}

export const RewardedAdTrigger: React.FC<RewardedAdTriggerProps> = ({
  lang,
  isUnlocked,
  onUnlock,
}) => {
  const [watching, setWatching] = useState(false);

  if (isUnlocked) return null;

  const handleWatchRewarded = () => {
    setWatching(true);
    setTimeout(() => {
      setWatching(false);
      onUnlock();
    }, 1400);
  };

  return (
    <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="text-xs text-slate-600 space-y-0.5">
        <div className="font-medium text-slate-900">
          {lang === 'ne'
            ? '१ वर्षको विस्तृत मूल्य इतिहास अनलक गर्नुहोस्'
            : 'Unlock Full 1-Year Price History & Raw Samples'}
        </div>
        <div className="text-slate-500 font-mono-num">
          Rewarded Test Unit · {ADMOB_CONFIG.rewardedAdUnitId}
        </div>
      </div>
      <button
        type="button"
        disabled={watching}
        onClick={handleWatchRewarded}
        className="min-h-[40px] px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
      >
        <PlayCircle className="w-4 h-4" />
        <span>
          {watching
            ? lang === 'ne'
              ? 'विज्ञापन लोड हुँदैछ...'
              : 'Playing Test Ad...'
            : lang === 'ne'
            ? 'विज्ञापन हेरी अनलक गर्नुहोस्'
            : 'Watch Ad to Unlock'}
        </span>
      </button>
    </div>
  );
};
