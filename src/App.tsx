import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Search,
  Camera,
  Home,
  Bookmark,
  User as UserIcon,
  MapPin,
  Bell,
  Trash2,
  X,
} from 'lucide-react';
import {
  auth,
  signInWithGooglePopup,
  signOutUser,
} from './lib/firebase';
import {
  ADMOB_CONFIG,
  ASSETS,
  AdvertisementItem,
  CategoryItem,
  FlagReportItem,
  INITIAL_ADS,
  INITIAL_CATEGORIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRICE_HISTORY,
  INITIAL_PRICE_REPORTS,
  INITIAL_PRODUCTS,
  INITIAL_SELLERS,
  INITIAL_SELLER_PRODUCTS,
  Language,
  NEPAL_DISTRICTS,
  NotificationItem,
  PriceAlertItem,
  PriceHistoryPoint,
  PriceReportItem,
  ProductItem,
  ReceiptItem,
  SavedProductItem,
  SellerItem,
  SellerProductItem,
  UI_STRINGS,
  formatNpr,
} from './data/nepalData';
import {
  fetchPublicCatalog,
  ensureUserProfile,
  fetchUserPrivateCollections,
  saveProductForUser,
  removeSavedProductForUser,
  createPriceAlertForUser,
  submitUserPriceReport,
  registerSellerAccount,
  createSellerProductListing,
  saveScannedReceipt,
  submitIncorrectPriceFlag,
  seedInitialCatalogToFirestore,
  adminUpdateSellerVerification,
  adminCreateCategory,
  logAnalyticsEvent,
} from './services/firestoreService';
import { ResilientImage } from './components/ResilientImage';
import { AdMobBanner, AdMobInterstitialModal } from './components/AdMobSlot';
import { ScannerView } from './components/ScannerView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProfileAndAdminView } from './components/ProfileAndAdminView';

export type NavTab = 'home' | 'search' | 'scan' | 'saved' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [lang, setLang] = useState<Language>('ne');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Kathmandu');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  // Auth & User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Catalog & Firestore state
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [sellers, setSellers] = useState<SellerItem[]>(INITIAL_SELLERS);
  const [sellerProducts, setSellerProducts] = useState<SellerProductItem[]>(
    INITIAL_SELLER_PRODUCTS
  );
  const [priceReports, setPriceReports] = useState<PriceReportItem[]>(INITIAL_PRICE_REPORTS);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>(INITIAL_PRICE_HISTORY);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [ads, setAds] = useState<AdvertisementItem[]>(INITIAL_ADS);
  const [isSeededInFirestore, setIsSeededInFirestore] = useState<boolean>(false);

  // User-specific collections (Firestore + Guest Local Fallback)
  const [savedProducts, setSavedProducts] = useState<SavedProductItem[]>([
    {
      id: 'guest_save_1',
      userId: 'guest',
      productId: 'prod_redmi_note13',
      productName: 'Redmi Note 13 4G (8GB / 256GB)',
      brand: 'Xiaomi',
      imageUrl: ASSETS.phoneImg,
      savedAtPrice: 25999,
      currentAvgPrice: 24500,
      alertEnabled: true,
      targetAlertPrice: 24000,
    },
  ]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertItem[]>([]);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [flagReports, setFlagReports] = useState<FlagReportItem[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([
    'prod_redmi_note13',
    'prod_acer_aspire5',
  ]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [filterDistrictOnly, setFilterDistrictOnly] = useState<boolean>(false);
  const [searchCount, setSearchCount] = useState<number>(0);
  const [showInterstitialAd, setShowInterstitialAd] = useState<boolean>(false);

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [districtModalOpen, setDistrictModalOpen] = useState<boolean>(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const t = UI_STRINGS[lang];
  const isAdmin = Boolean(
    currentUser &&
      currentUser.email === 'rokeyghimire530@gmail.com' &&
      currentUser.emailVerified
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Load Public Catalog from Firestore
  const loadCatalog = async () => {
    try {
      const data = await fetchPublicCatalog();
      setCategories(data.categories);
      setProducts(data.products);
      setSellers(data.sellers);
      setSellerProducts(data.sellerProducts);
      setPriceReports(data.priceReports);
      setPriceHistory(data.priceHistory);
      setNotifications(data.notifications);
      setAds(data.ads);
      setIsSeededInFirestore(data.isSeededInFirestore);
    } catch {
      // Uses initial seed fallback gracefully on offline or initial state
    }
  };

  useEffect(() => {
    loadCatalog();
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (user) {
        try {
          await ensureUserProfile(
            user.uid,
            user.displayName || 'Nepal User',
            user.email || 'user@example.com',
            selectedDistrict,
            lang
          );
          const priv = await fetchUserPrivateCollections(user.uid);
          if (priv.savedProducts.length > 0) setSavedProducts(priv.savedProducts);
          setPriceAlerts(priv.priceAlerts);
          setReceipts(priv.receipts);
          setFlagReports(priv.flagReports);
        } catch {
          // Non-fatal
        }
      }
    });
    return () => unsub();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
      if (filterDistrictOnly && p.district !== selectedDistrict) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.nameNe.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, selectedCategoryId, filterDistrictOnly, selectedDistrict]);

  const priceDropProducts = useMemo(
    () => products.filter((p) => (p.priceDropPercent || 0) > 0),
    [products]
  );

  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is ProductItem => Boolean(p)),
    [recentlyViewedIds, products]
  );

  const handleOpenProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setRecentlyViewedIds((prev) => [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 6));
    logAnalyticsEvent('product_view', product.id, selectedDistrict, product.name);
  };

  const handleTriggerSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveTab('search');
    const nextCount = searchCount + 1;
    setSearchCount(nextCount);
    if (nextCount % ADMOB_CONFIG.interstitialSearchFrequency === 0) {
      setShowInterstitialAd(true);
      logAnalyticsEvent('ad_impression', 'interstitial', selectedDistrict, 'search_interstitial');
    }
    if (searchQuery.trim()) {
      logAnalyticsEvent('search', 'search_query', selectedDistrict, searchQuery.trim());
    }
  };

  const handleToggleSaveProduct = async (product: ProductItem) => {
    const existing = savedProducts.find((s) => s.productId === product.id);
    if (existing) {
      setSavedProducts((prev) => prev.filter((s) => s.productId !== product.id));
      if (currentUser) {
        try {
          await removeSavedProductForUser(existing.id);
        } catch {
          // Local state updated
        }
      }
      showToast(lang === 'ne' ? 'सेभ सूचीबाट हटाइयो' : 'Removed from Saved Products');
    } else {
      const newSaved: SavedProductItem = {
        id: `save_${Date.now()}`,
        userId: currentUser?.uid || 'guest',
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        savedAtPrice: product.maxPrice,
        currentAvgPrice: product.avgPrice,
        alertEnabled: true,
        targetAlertPrice: Math.round(product.minPrice * 0.96),
      };
      setSavedProducts((prev) => [newSaved, ...prev]);
      if (currentUser) {
        try {
          await saveProductForUser(product, newSaved.targetAlertPrice);
          logAnalyticsEvent('save_product', product.id, selectedDistrict, product.name);
        } catch {
          // Local state updated
        }
      }
      showToast(lang === 'ne' ? 'सामान सफलतापूर्वक सेभ गरियो!' : 'Saved to your watchlist!');
    }
  };

  const handleAddScannedProduct = async (newProd: ProductItem) => {
    setProducts((prev) => [newProd, ...prev]);
    logAnalyticsEvent('scanner_use', newProd.id, selectedDistrict, newProd.name);
  };

  const handleSaveReceiptRecord = async (receiptData: {
    shopName: string;
    district: string;
    billDate: string;
    totalAmount: number;
    itemsCount: number;
    summaryText: string;
  }) => {
    const newRec: ReceiptItem = {
      id: `rcpt_${Date.now()}`,
      userId: currentUser?.uid || 'guest',
      ...receiptData,
      status: 'saved',
    };
    setReceipts((prev) => [newRec, ...prev]);
    if (currentUser) {
      try {
        await saveScannedReceipt(receiptData);
      } catch {
        // Saved locally if offline
      }
    }
  };

  const handleUserPriceReport = async (data: {
    product: ProductItem;
    pricePaid: number;
    quantity: number;
    district: string;
    shopName: string;
    purchaseDate: string;
    receiptUrl?: string;
  }) => {
    const newReport: PriceReportItem = {
      id: `pr_${Date.now()}`,
      userId: currentUser?.uid || 'guest',
      userName: currentUser?.displayName || (lang === 'ne' ? 'नेपाली उपभोक्ता' : 'Nepal Shopper'),
      productId: data.product.id,
      productName: data.product.name,
      pricePaid: data.pricePaid,
      quantity: data.quantity,
      district: data.district,
      shopName: data.shopName,
      purchaseDate: data.purchaseDate,
      receiptUrl: data.receiptUrl || '',
      status: 'approved',
      visibility: 'public',
    };
    setPriceReports((prev) => [newReport, ...prev]);

    if (currentUser) {
      try {
        await submitUserPriceReport(data);
        logAnalyticsEvent('price_report', data.product.id, data.district, String(data.pricePaid));
      } catch {
        // Kept in state
      }
    }
  };

  const handleCreatePriceAlert = async (
    product: ProductItem,
    targetPrice: number,
    district: string
  ) => {
    const newAlert: PriceAlertItem = {
      id: `alert_${Date.now()}`,
      userId: currentUser?.uid || 'guest',
      productId: product.id,
      productName: product.name,
      targetPrice,
      currentAvgPrice: product.avgPrice,
      district,
      status: 'active',
    };
    setPriceAlerts((prev) => [newAlert, ...prev]);
    if (currentUser) {
      try {
        await createPriceAlertForUser(product, targetPrice, district);
      } catch {
        // Kept in state
      }
    }
  };

  const handleFlagIncorrectPrice = async (data: {
    product: ProductItem;
    reportedPrice: number;
    reason: string;
    details: string;
  }) => {
    const newFlag: FlagReportItem = {
      id: `flag_${Date.now()}`,
      userId: currentUser?.uid || 'guest',
      productId: data.product.id,
      productName: data.product.name,
      reportedPrice: data.reportedPrice,
      reason: data.reason,
      details: data.details,
      status: 'open',
    };
    setFlagReports((prev) => [newFlag, ...prev]);
    if (currentUser) {
      try {
        await submitIncorrectPriceFlag(data);
      } catch {
        // Kept in state
      }
    }
  };

  const handleRegisterSeller = async (data: {
    shopName: string;
    district: string;
    marketArea: string;
    categoryFocus: string;
    phone: string;
    panNumber: string;
  }) => {
    const newSeller: SellerItem = {
      id: `seller_${currentUser?.uid || Date.now()}`,
      ownerId: currentUser?.uid || 'guest',
      shopName: data.shopName,
      district: data.district,
      marketArea: data.marketArea,
      categoryFocus: data.categoryFocus,
      verified: false, // Never auto-verify; Admin must approve
      status: 'pending',
      visibility: 'public',
      updatedAtLabel: '2026-10-02',
    };
    setSellers((prev) => [newSeller, ...prev]);
    if (currentUser) {
      try {
        await registerSellerAccount(data);
        logAnalyticsEvent('seller_register', newSeller.id, data.district, data.shopName);
      } catch {
        // Kept in state
      }
    }
  };

  const handleAddSellerProduct = async (data: {
    seller: SellerItem;
    product: ProductItem;
    price: number;
    stockStatus: 'in_stock' | 'limited' | 'out_of_stock';
    inquiryPhoneHint: string;
  }) => {
    const newSp: SellerProductItem = {
      id: `sp_${Date.now()}`,
      sellerId: data.seller.id,
      ownerId: currentUser?.uid || 'guest',
      shopName: data.seller.shopName,
      district: data.seller.district,
      verifiedSeller: data.seller.verified,
      productId: data.product.id,
      productName: data.product.name,
      price: data.price,
      stockStatus: data.stockStatus,
      inquiryPhoneHint: data.inquiryPhoneHint,
      visibility: 'public',
      updatedAtLabel: '2026-10-02',
    };
    setSellerProducts((prev) => [newSp, ...prev]);
    if (currentUser) {
      try {
        await createSellerProductListing(data);
      } catch {
        // Kept in state
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGooglePopup();
      showToast(lang === 'ne' ? 'Google लगइन सफल भयो!' : 'Signed in with Google!');
    } catch {
      showToast(
        lang === 'ne'
          ? 'लगइन रद्द गरियो वा समस्या आयो। अतिथि मोडमा जारी राख्नुहोस्।'
          : 'Sign-in cancelled. Continuing in Guest mode.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    showToast(lang === 'ne' ? 'लगआउट गरियो' : 'Signed out');
  };

  const handleDeleteAccount = async () => {
    setSavedProducts([]);
    setPriceAlerts([]);
    setReceipts([]);
    await signOutUser();
    showToast(lang === 'ne' ? 'तपाईंको खाता र डेटा हटाइयो।' : 'Account and personal data deleted.');
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F6] text-slate-900 pb-16 md:pb-0">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setSelectedProduct(null);
            setActiveTab('home');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap"
        >
          Kati Paryo?
        </a>

        {/* Zone 2: 5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => {
              setSelectedProduct(null);
              setActiveTab('home');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              activeTab === 'home' && !selectedProduct ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            {t.navHome}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProduct(null);
              setActiveTab('search');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              activeTab === 'search' && !selectedProduct ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            {t.navSearch}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProduct(null);
              setActiveTab('scan');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              activeTab === 'scan' && !selectedProduct ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            {t.navScan}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProduct(null);
              setActiveTab('saved');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              activeTab === 'saved' && !selectedProduct ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            {t.navSaved}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProduct(null);
              setActiveTab('profile');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              activeTab === 'profile' && !selectedProduct ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            {t.navProfile}
          </button>
        </nav>

        {/* Zone 3: 2 primary actions (Location District Picker + Notifications) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDistrictModalOpen(true)}
            className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-red-700" />
            <span>
              {NEPAL_DISTRICTS.find((d) => d.id === selectedDistrict)?.[
                lang === 'ne' ? 'nameNe' : 'nameEn'
              ] || selectedDistrict}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setNotifDrawerOpen(!notifDrawerOpen)}
            aria-label="Notifications"
            className="min-h-[38px] min-w-[38px] px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="font-mono-num font-bold text-red-700">{unreadNotifCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Notifications Dropdown Drawer */}
      {notifDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto space-y-4 border-l border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'ne' ? 'नोटिफिकेसन र मूल्य अपडेट' : 'Notifications & Price Drop Alerts'}
              </h2>
              <button
                type="button"
                onClick={() => setNotifDrawerOpen(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
                    );
                    const target = products.find((p) => p.id === n.productId);
                    if (target) {
                      setNotifDrawerOpen(false);
                      handleOpenProduct(target);
                    }
                  }}
                  className="py-3.5 cursor-pointer hover:bg-slate-50 rounded-lg px-2 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className={n.isRead ? 'text-slate-500' : 'font-semibold text-red-700'}>
                      {n.type === 'price_drop' ? 'Price Drop' : 'Update'}
                    </span>
                    <span>{n.createdAtLabel}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {lang === 'ne' ? n.titleNe : n.titleEn}
                  </div>
                  <p className="text-xs text-slate-600">
                    {lang === 'ne' ? n.bodyNe : n.bodyEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Nepal City / District Picker Modal */}
      {districtModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {lang === 'ne'
                    ? 'आफ्नो सहर वा जिल्ला छान्नुहोस्'
                    : 'Select Your Nepal City / District'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'ne'
                    ? 'GPS लोकेसन अनुमति आवश्यक पर्दैन — आफैँ जिल्ला छान्नुहोस्।'
                    : 'No precise GPS location required — choose manually.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDistrictModalOpen(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {NEPAL_DISTRICTS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDistrict(d.id);
                    setDistrictModalOpen(false);
                    showToast(
                      lang === 'ne'
                        ? `स्थान परिवर्तन गरियो: ${d.nameNe}`
                        : `Location set to ${d.nameEn}`
                    );
                  }}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-left transition-colors ${
                    selectedDistrict === d.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{d.nameNe}</div>
                  <div
                    className={`text-[11px] truncate ${
                      selectedDistrict === d.id ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {d.nameEn}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Natural Navigation AdMob Interstitial Modal */}
      <AdMobInterstitialModal
        isOpen={showInterstitialAd}
        onClose={() => setShowInterstitialAd(false)}
        lang={lang}
      />

      {/* MAIN CONTENT VIEWPORT (1440px baseline container) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {selectedProduct ? (
          <ProductDetailModal
            product={selectedProduct}
            lang={lang}
            selectedDistrict={selectedDistrict}
            isSaved={savedProducts.some((s) => s.productId === selectedProduct.id)}
            sellerProducts={sellerProducts}
            priceReports={priceReports}
            priceHistory={priceHistory}
            onClose={() => setSelectedProduct(null)}
            onToggleSave={handleToggleSaveProduct}
            onSubmitPriceReport={handleUserPriceReport}
            onCreatePriceAlert={handleCreatePriceAlert}
            onReportIncorrectPrice={handleFlagIncorrectPrice}
          />
        ) : activeTab === 'home' ? (
          <div className="space-y-10">
            {/* HERO CAMPAIGN ANCHOR WITH MEASURED CONTRAST SCRIM */}
            <section className="relative rounded-3xl overflow-hidden bg-slate-900 min-h-[320px] flex items-end p-6 sm:p-10">
              <div className="absolute inset-0">
                <ResilientImage
                  src={ASSETS.heroImg}
                  alt="Kathmandu Nepal retail market"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />
              </div>

              <div className="relative z-10 w-full max-w-2xl space-y-4">
                <div className="text-xs text-slate-300 font-medium">
                  <span>{t.appNameNe}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{t.tagline}</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  {lang === 'ne'
                    ? 'नेपालको बजारमा सामान किन्नुअघि वास्तविक मूल्य थाहा पाऔँ।'
                    : 'Check Real Nepal Market Prices Before You Shop.'}
                </h1>

                {/* Search Bar + Camera Scan Trigger */}
                <form
                  onSubmit={handleTriggerSearch}
                  className="flex flex-col sm:flex-row gap-2.5 pt-1"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full min-h-[48px] pl-10 pr-4 py-2.5 bg-white text-slate-900 text-sm rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="min-h-[48px] px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                    >
                      {t.navSearch}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('scan')}
                      className="min-h-[48px] px-4 py-2.5 bg-white/95 hover:bg-white text-slate-900 text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <Camera className="w-4 h-4 text-red-700" />
                      <span>{t.scanPhotoBtn}</span>
                    </button>
                  </div>
                </form>

                {/* Transparency Disclaimer */}
                <p className="text-xs text-slate-300">
                  {t.verifyDisclaimer}
                </p>
              </div>
            </section>

            {/* INTERACTIVE CATEGORY FILTER BAR */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{t.categoriesTitle}</h2>
                <button
                  type="button"
                  onClick={() => setFilterDistrictOnly(!filterDistrictOnly)}
                  className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    filterDistrictOnly
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {filterDistrictOnly
                    ? `${selectedDistrict} Only`
                    : lang === 'ne'
                    ? `${selectedDistrict} मात्र फिल्टर गर्नुहोस्`
                    : `Filter by ${selectedDistrict}`}
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategoryId === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'ne' ? 'सबै सामान (All)' : 'All Categories'}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategoryId === cat.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'ne' ? cat.nameNe : cat.nameEn}
                  </button>
                ))}
              </div>
            </section>

            {/* POPULAR PRODUCTS CATALOG GRID */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{t.popularProducts}</h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'ne'
                      ? 'स्रोत अनुसार स्पष्ट रूपमा "Estimated", "Seller Price", वा "User Reported" उल्लेख गरिएको'
                      : 'Every listing clearly states whether it is Estimated, Seller Price, or User Reported'}
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-mono-num">
                  {filteredProducts.length} items
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                  <p className="text-base font-semibold text-slate-900">
                    {t.unavailablePriceMsg}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId('all');
                      setFilterDistrictOnly(false);
                      setSearchQuery('');
                    }}
                    className="min-h-[40px] px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
                  >
                    {t.tryAgainMsg}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleOpenProduct(product)}
                      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-4/3 bg-slate-100 overflow-hidden">
                          <ResilientImage
                            src={product.imageUrl}
                            alt={product.name}
                            fallbackLabel={product.name}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                          />
                        </div>

                        <div className="p-5 space-y-2">
                          {/* Unboxed metadata line with typographic separator */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            <span className="font-semibold text-red-700">
                              {product.priceSource}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{product.brand}</span>
                            <span aria-hidden="true">·</span>
                            <span>{product.district}</span>
                          </div>

                          <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
                            {lang === 'ne' ? product.nameNe : product.name}
                          </h3>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-slate-500">
                            {lang === 'ne' ? 'अनुमानित मूल्य सीमा' : 'Nepal Market Range'}
                          </div>
                          <div className="text-sm font-semibold text-slate-900 font-mono-num">
                            {formatNpr(product.minPrice)} – {formatNpr(product.maxPrice)}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[11px] text-slate-500">Avg</div>
                          <div className="text-base font-bold text-red-700 font-mono-num">
                            {formatNpr(product.avgPrice)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* RECENT PRICE DROPS & NEARBY SELLERS */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              {/* Price Drops Column */}
              <div className="lg:col-span-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">{t.priceDrops}</h2>
                <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100">
                  {priceDropProducts.slice(0, 4).map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleOpenProduct(prod)}
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-emerald-700 font-semibold font-mono-num">
                          -{prod.priceDropPercent}% Price Drop · {prod.priceSource}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                          {lang === 'ne' ? prod.nameNe : prod.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {prod.district} · Updated {prod.updatedAtLabel}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-slate-900 font-mono-num">
                          {formatNpr(prod.avgPrice)}
                        </div>
                        <div className="text-[11px] text-slate-400 line-through font-mono-num">
                          {formatNpr(prod.maxPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby Sellers Column */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{t.nearbySellers}</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="text-xs font-semibold text-red-700 hover:underline whitespace-nowrap"
                  >
                    {lang === 'ne' ? '+ पसल दर्ता गर्नुहोस्' : '+ Register Your Shop'}
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100">
                  {sellers.map((s) => (
                    <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs text-slate-500">
                          <span>{s.categoryFocus}</span>
                          <span aria-hidden="true"> · </span>
                          <span
                            className={
                              s.verified ? 'font-semibold text-emerald-700' : 'text-slate-500'
                            }
                          >
                            {s.verified ? 'Verified Seller' : 'Unverified Seller'}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {s.shopName}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {s.marketArea}, {s.district}
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500 shrink-0 font-mono-num">
                        Updated {s.updatedAtLabel}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* RECENTLY VIEWED */}
            {recentlyViewedProducts.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900">{t.recentlyViewed}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recentlyViewedProducts.slice(0, 3).map((rp) => (
                    <div
                      key={rp.id}
                      onClick={() => handleOpenProduct(rp)}
                      className="bg-white rounded-xl border border-slate-200/90 p-3.5 flex items-center gap-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <ResilientImage src={rp.imageUrl} alt={rp.name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-500 truncate">
                          {rp.brand} · {rp.priceSource}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {lang === 'ne' ? rp.nameNe : rp.name}
                        </div>
                        <div className="text-xs font-bold text-red-700 font-mono-num">
                          {formatNpr(rp.avgPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* NON-INTRUSIVE GOOGLE ADMOB BANNER */}
            <AdMobBanner
              lang={lang}
              placementName="Home Screen Footer Banner"
              onAdClick={() =>
                logAnalyticsEvent('ad_click', 'home_banner', selectedDistrict, 'admob_banner')
              }
            />
          </div>
        ) : activeTab === 'search' ? (
          <div className="space-y-6 pb-10">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
              <form onSubmit={handleTriggerSearch} className="flex gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full min-h-[46px] pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[46px] px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl whitespace-nowrap"
                >
                  {t.navSearch}
                </button>
              </form>

              {/* Quick Search Suggestions */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500">
                  {lang === 'ne' ? 'सुझावहरू:' : 'Suggestions:'}
                </span>
                {[
                  'Redmi Note 13',
                  'Samsung',
                  'MacBook Air',
                  'Pressure Cooker',
                  'Cement',
                  'Jira Masino Rice',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setSearchQuery(sug)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors whitespace-nowrap"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleOpenProduct(product)}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-4/3 bg-slate-100 overflow-hidden">
                      <ResilientImage src={product.imageUrl} alt={product.name} />
                    </div>
                    <div className="p-5 space-y-1.5">
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-red-700">{product.priceSource}</span> ·{' '}
                        {product.brand} · {product.district}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {lang === 'ne' ? product.nameNe : product.name}
                      </h3>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono-num">
                      {formatNpr(product.minPrice)} – {formatNpr(product.maxPrice)}
                    </span>
                    <span className="text-base font-bold text-red-700 font-mono-num">
                      {formatNpr(product.avgPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <AdMobBanner lang={lang} placementName="Search Results Bottom Banner" />
          </div>
        ) : activeTab === 'scan' ? (
          <ScannerView
            lang={lang}
            selectedDistrict={selectedDistrict}
            categories={categories}
            onAddScannedProductToCatalog={handleAddScannedProduct}
            onSaveReceiptRecord={handleSaveReceiptRecord}
            onSelectProduct={handleOpenProduct}
          />
        ) : activeTab === 'saved' ? (
          <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <div className="border-b border-slate-200 pb-4">
              <h1 className="text-2xl font-bold text-slate-900">
                {lang === 'ne' ? 'सेभ गरिएका सामानहरू (Saved Products)' : 'Saved Products & Watchlist'}
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                {lang === 'ne'
                  ? 'हालको अनुमानित मूल्य, अघिल्लो मूल्य, मूल्य परिवर्तन र अलर्ट स्थिति हेर्नुहोस्।'
                  : 'Track current estimated price, previous price, price change, and alert status.'}
              </p>
            </div>

            {savedProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <p className="text-sm text-slate-600">
                  {lang === 'ne'
                    ? 'तपाईंले अहिलेसम्म कुनै सामान सेभ गर्नुभएको छैन।'
                    : 'You have not saved any products yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="min-h-[42px] px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
                >
                  {lang === 'ne' ? 'सामानहरू हेर्नुहोस्' : 'Browse Nepal Catalog'}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100">
                {savedProducts.map((sv) => {
                  const diff = sv.currentAvgPrice - sv.savedAtPrice;
                  const matchingProd = products.find((p) => p.id === sv.productId);
                  return (
                    <div
                      key={sv.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div
                        onClick={() => matchingProd && handleOpenProduct(matchingProd)}
                        className="flex items-center gap-4 cursor-pointer"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          <ResilientImage src={sv.imageUrl} alt={sv.productName} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500">
                            <span>{sv.brand}</span>
                            <span aria-hidden="true"> · </span>
                            <span>
                              Alert:{' '}
                              {sv.alertEnabled
                                ? `Active (< ${formatNpr(sv.targetAlertPrice)})`
                                : 'Off'}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900">
                            {sv.productName}
                          </h3>
                          <div className="text-xs text-slate-500 font-mono-num">
                            Previous Price: {formatNpr(sv.savedAtPrice)} · Change:{' '}
                            <span
                              className={
                                diff < 0
                                  ? 'text-emerald-700 font-semibold'
                                  : diff > 0
                                  ? 'text-red-700 font-semibold'
                                  : 'text-slate-600'
                              }
                            >
                              {diff < 0
                                ? `-${formatNpr(Math.abs(diff))}`
                                : diff > 0
                                ? `+${formatNpr(diff)}`
                                : 'No change'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Current Est. Price</div>
                          <div className="text-lg font-bold text-red-700 font-mono-num">
                            {formatNpr(sv.currentAvgPrice)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (matchingProd) handleToggleSaveProduct(matchingProd);
                            else setSavedProducts((prev) => prev.filter((i) => i.id !== sv.id));
                          }}
                          aria-label="Remove saved product"
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <ProfileAndAdminView
            currentUser={currentUser}
            isAdmin={isAdmin}
            lang={lang}
            onChangeLang={setLang}
            selectedDistrict={selectedDistrict}
            onChangeDistrict={setSelectedDistrict}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={setNotificationsEnabled}
            onGoogleSignIn={handleGoogleSignIn}
            onSignOut={handleSignOut}
            onDeleteAccountData={handleDeleteAccount}
            categories={categories}
            products={products}
            sellers={sellers}
            sellerProducts={sellerProducts}
            priceReports={priceReports}
            priceAlerts={priceAlerts}
            receipts={receipts}
            flagReports={flagReports}
            ads={ads}
            isSeededInFirestore={isSeededInFirestore}
            onRegisterSeller={handleRegisterSeller}
            onAddSellerProduct={handleAddSellerProduct}
            onAdminSeedDatabase={async () => {
              await seedInitialCatalogToFirestore();
              await loadCatalog();
            }}
            onAdminVerifySeller={async (seller, verified, status) => {
              setSellers((prev) =>
                prev.map((s) => (s.id === seller.id ? { ...s, verified, status } : s))
              );
              if (currentUser) {
                await adminUpdateSellerVerification(seller, verified, status);
              }
            }}
            onAdminAddCategory={async (catData) => {
              const newCat: CategoryItem = {
                id: `cat_${catData.slug}`,
                ...catData,
                visibility: 'public',
              };
              setCategories((prev) => [...prev, newCat]);
              if (currentUser) {
                await adminCreateCategory(catData);
              }
            }}
          />
        )}
      </main>

      {/* QUIET FOOTER (Desktop) */}
      <footer className="hidden md:block border-t border-slate-200 bg-white py-6 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            Kati Paryo? (कति पर्यो?) — सामान किन्नुअघि, मूल्य थाहा पाऔँ। · Built for Nepal
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setSelectedProduct(null);
                setActiveTab('profile');
              }}
              className="hover:text-slate-900"
            >
              Privacy Policy & Terms
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedProduct(null);
                setActiveTab('profile');
              }}
              className="hover:text-slate-900"
            >
              Seller Portal
            </button>
            <button
              type="button"
              onClick={() => setLang(lang === 'ne' ? 'en' : 'ne')}
              className="font-semibold text-slate-800"
            >
              {lang === 'ne' ? 'Switch to English' : 'नेपालीमा हेर्नुहोस्'}
            </button>
          </div>
        </div>
      </footer>

      {/* FIXED BOTTOM NAVIGATION BAR (Mobile-first 5-tab layout, <=15% sticky cap) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center h-14"
      >
        <button
          type="button"
          onClick={() => {
            setSelectedProduct(null);
            setActiveTab('home');
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center ${
            activeTab === 'home' && !selectedProduct ? 'text-red-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">{t.navHome}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedProduct(null);
            setActiveTab('search');
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center ${
            activeTab === 'search' && !selectedProduct ? 'text-red-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">{t.navSearch}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedProduct(null);
            setActiveTab('scan');
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center ${
            activeTab === 'scan' && !selectedProduct ? 'text-red-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">{t.navScan}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedProduct(null);
            setActiveTab('saved');
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center ${
            activeTab === 'saved' && !selectedProduct ? 'text-red-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">{t.navSaved}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedProduct(null);
            setActiveTab('profile');
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center ${
            activeTab === 'profile' && !selectedProduct ? 'text-red-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">
            {authReady && currentUser ? 'Account' : t.navProfile}
          </span>
        </button>
      </nav>
    </div>
  );
}
