import React, { useState } from 'react';
import {
  LogIn,
  LogOut,
  Store,
  ShieldCheck,
  Bell,
  FileText,
  Settings,
  Trash2,
  CheckCircle2,
  Database,
  Plus,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  ADMOB_CONFIG,
  AdvertisementItem,
  CategoryItem,
  FlagReportItem,
  Language,
  NEPAL_DISTRICTS,
  PriceAlertItem,
  PriceReportItem,
  ProductItem,
  ReceiptItem,
  SellerItem,
  SellerProductItem,
  formatNpr,
} from '../data/nepalData';

interface ProfileAndAdminViewProps {
  currentUser: User | null;
  isAdmin: boolean;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  selectedDistrict: string;
  onChangeDistrict: (district: string) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onDeleteAccountData: () => Promise<void>;
  // Data lists
  categories: CategoryItem[];
  products: ProductItem[];
  sellers: SellerItem[];
  sellerProducts: SellerProductItem[];
  priceReports: PriceReportItem[];
  priceAlerts: PriceAlertItem[];
  receipts: ReceiptItem[];
  flagReports: FlagReportItem[];
  ads: AdvertisementItem[];
  isSeededInFirestore: boolean;
  // Actions
  onRegisterSeller: (data: {
    shopName: string;
    district: string;
    marketArea: string;
    categoryFocus: string;
    phone: string;
    panNumber: string;
  }) => Promise<void>;
  onAddSellerProduct: (data: {
    seller: SellerItem;
    product: ProductItem;
    price: number;
    stockStatus: 'in_stock' | 'limited' | 'out_of_stock';
    inquiryPhoneHint: string;
  }) => Promise<void>;
  onAdminSeedDatabase: () => Promise<void>;
  onAdminVerifySeller: (
    seller: SellerItem,
    verified: boolean,
    status: 'approved' | 'rejected' | 'pending'
  ) => Promise<void>;
  onAdminAddCategory: (data: {
    nameNe: string;
    nameEn: string;
    slug: string;
    iconName: string;
    sortOrder: number;
  }) => Promise<void>;
}

export const ProfileAndAdminView: React.FC<ProfileAndAdminViewProps> = ({
  currentUser,
  isAdmin,
  lang,
  onChangeLang,
  selectedDistrict,
  onChangeDistrict,
  notificationsEnabled,
  onToggleNotifications,
  onGoogleSignIn,
  onSignOut,
  onDeleteAccountData,
  categories,
  products,
  sellers,
  sellerProducts,
  priceReports,
  priceAlerts,
  receipts,
  flagReports,
  ads,
  isSeededInFirestore,
  onRegisterSeller,
  onAddSellerProduct,
  onAdminSeedDatabase,
  onAdminVerifySeller,
  onAdminAddCategory,
}) => {
  const [subTab, setSubTab] = useState<'overview' | 'seller' | 'admin' | 'settings' | 'legal'>(
    'overview'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Seller Registration Form State
  const [shopName, setShopName] = useState('');
  const [shopDistrict, setShopDistrict] = useState(selectedDistrict);
  const [marketArea, setMarketArea] = useState('');
  const [categoryFocus, setCategoryFocus] = useState('Mobile & Electronics');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerPan, setSellerPan] = useState('');

  // Seller Product Price Form State
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [sellerOfferPrice, setSellerOfferPrice] = useState(24000);
  const [sellerStock, setSellerStock] = useState<'in_stock' | 'limited' | 'out_of_stock'>(
    'in_stock'
  );
  const [inquiryPhoneHint, setInquiryPhoneHint] = useState('98510XXXXX');

  // Admin New Category State
  const [newCatNe, setNewCatNe] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

  const mySellerProfile = sellers.find(
    (s) => currentUser && s.ownerId === currentUser.uid
  );

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegisterSeller({
      shopName,
      district: shopDistrict,
      marketArea,
      categoryFocus,
      phone: sellerPhone,
      panNumber: sellerPan,
    });
    setStatusMessage(
      lang === 'ne'
        ? 'तपाईंको पसल दर्ता आवेदन पेश भयो। एडमिन स्वीकृति पछि "Verified Seller" चिन्ह प्राप्त हुनेछ।'
        : 'Seller profile registered! Pending admin verification for the Verified Seller badge.'
    );
  };

  const handleSellerProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSeller = mySellerProfile || sellers[0];
    const targetProduct = products.find((p) => p.id === selectedProdId) || products[0];
    if (!targetSeller || !targetProduct) return;
    await onAddSellerProduct({
      seller: targetSeller,
      product: targetProduct,
      price: sellerOfferPrice,
      stockStatus: sellerStock,
      inquiryPhoneHint,
    });
    setStatusMessage(
      lang === 'ne'
        ? 'तपाईंको पसलको मूल्य सूचीमा थपियो!'
        : 'Product price listing published for your shop!'
    );
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNe || !newCatEn || !newCatSlug) return;
    await onAdminAddCategory({
      nameNe: newCatNe,
      nameEn: newCatEn,
      slug: newCatSlug,
      iconName: 'Package',
      sortOrder: categories.length + 1,
    });
    setNewCatNe('');
    setNewCatEn('');
    setNewCatSlug('');
    setStatusMessage('New category added to Firestore!');
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      {/* Account Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-slate-500">
            {currentUser
              ? isAdmin
                ? 'Verified Administrator Account'
                : 'Authenticated Nepal User Account'
              : lang === 'ne'
              ? 'अतिथि मोड (Guest Browsing Mode)'
              : 'Guest Browsing Mode'}
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {currentUser
              ? currentUser.displayName || currentUser.email
              : lang === 'ne'
              ? 'नमस्ते, Kati Paryo? प्रयोगकर्ता'
              : 'Welcome to Kati Paryo?'}
          </h1>
          <p className="text-xs text-slate-500">
            {currentUser
              ? `${currentUser.email} · ${selectedDistrict}`
              : lang === 'ne'
              ? 'मूल्य रिपोर्ट पठाउन, सामान सेभ गर्न र विक्रेता खाता चलाउन Google लगइन गर्नुहोस्।'
              : 'Sign in with Google to submit prices, save products, set alerts, or register a seller shop.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {currentUser ? (
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === 'ne' ? 'लगआउट गर्नुहोस्' : 'Sign Out'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="min-h-[44px] px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <LogIn className="w-4 h-4" />
              <span>{lang === 'ne' ? 'Google बाट लगइन गर्नुहोस्' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 rounded-xl">
        <button
          type="button"
          onClick={() => setSubTab('overview')}
          className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            subTab === 'overview'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {lang === 'ne' ? 'मेरा रिपोर्ट र अलर्ट' : 'My Reports & Alerts'}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('seller')}
          className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'seller'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>{lang === 'ne' ? 'मेरो विक्रेता खाता' : 'My Seller Account'}</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setSubTab('admin')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'admin'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-red-700 hover:text-red-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'ne' ? 'एडमिन प्यानल' : 'Admin Dashboard'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setSubTab('settings')}
          className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'settings'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{lang === 'ne' ? 'सेटिङ्स' : 'Settings'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('legal')}
          className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            subTab === 'legal'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{lang === 'ne' ? 'गोपनीयता र Play Store गाइड' : 'Legal & Play Store Guide'}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-900 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: MY REPORTS, ALERTS & RECEIPTS */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Price Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-700" />
                <span>{lang === 'ne' ? 'मेरा मूल्य अलर्टहरू (Price Alerts)' : 'My Price Drop Alerts'}</span>
              </h2>
              <span className="text-xs text-slate-500 font-mono-num">
                {priceAlerts.length} active
              </span>
            </div>

            {priceAlerts.length === 0 ? (
              <p className="text-sm text-slate-500">
                {lang === 'ne'
                  ? 'तपाईंले अहिलेसम्म कुनै मूल्य अलर्ट सेट गर्नुभएको छैन।'
                  : 'You have not configured any price-drop alerts yet.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {priceAlerts.map((al) => (
                  <div key={al.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{al.productName}</div>
                      <div className="text-xs text-slate-500">
                        Target: Below {formatNpr(al.targetPrice)} · District: {al.district}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-700">{al.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scanned Receipts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'ne' ? 'स्क्यान गरिएका बिलहरू (Scanned Bills)' : 'My Scanned Receipts'}
              </h2>
              <span className="text-xs text-slate-500 font-mono-num">
                {receipts.length} saved
              </span>
            </div>

            {receipts.length === 0 ? (
              <p className="text-sm text-slate-500">
                {lang === 'ne'
                  ? 'अहिलेसम्म कुनै बिल सेभ गरिएको छैन। स्क्यान ट्याबबाट बिल अपलोड गर्नुहोस्।'
                  : 'No scanned receipts saved yet. Use the Bill Scanner in the Scan tab.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {receipts.map((rc) => (
                  <div key={rc.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">
                        {rc.shopName} ({rc.district})
                      </span>
                      <span className="text-sm font-bold text-red-700 font-mono-num">
                        {formatNpr(rc.totalAmount)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Date: {rc.billDate} · Items: {rc.itemsCount} · {rc.summaryText}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY SELLER ACCOUNT */}
      {subTab === 'seller' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {lang === 'ne'
                  ? 'विक्रेता प्रोफाइल र पसल दर्ता (Seller Portal)'
                  : 'Seller Account & Shop Profile'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ne'
                  ? 'तपाईंको फोन र प्यान नम्बर गोप्य र सुरक्षित संग्रहमा राखिन्छ। एडमिनले जाँच गरेपछि मात्र "Verified Seller" प्राप्त हुन्छ।'
                  : 'Phone and PAN are isolated in a private subcollection. Verified Seller badge requires explicit Admin approval.'}
              </p>
            </div>

            {mySellerProfile && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-xs text-slate-500">
                  Status: <span className="font-semibold text-slate-900">{mySellerProfile.status}</span> ·{' '}
                  {mySellerProfile.verified ? 'Verified Seller Badge Active' : 'Pending Admin Verification'}
                </div>
                <div className="text-base font-bold text-slate-900">{mySellerProfile.shopName}</div>
                <div className="text-xs text-slate-600">
                  {mySellerProfile.marketArea}, {mySellerProfile.district} · {mySellerProfile.categoryFocus}
                </div>
              </div>
            )}

            <form onSubmit={handleSellerSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  {lang === 'ne' ? 'पसलको नाम (Shop Name)' : 'Shop Name'}
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g., Kantipur Gadget Store"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  {lang === 'ne' ? 'जिल्ला / सहर (District)' : 'District / City'}
                </label>
                <select
                  value={shopDistrict}
                  onChange={(e) => setShopDistrict(e.target.value)}
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
                  {lang === 'ne' ? 'बजार क्षेत्र / ठेगाना' : 'Market Area / Street'}
                </label>
                <input
                  type="text"
                  required
                  value={marketArea}
                  onChange={(e) => setMarketArea(e.target.value)}
                  placeholder="e.g., New Road Gate, Ward 22"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  {lang === 'ne' ? 'मुख्य सामानको श्रेणी' : 'Primary Category'}
                </label>
                <select
                  value={categoryFocus}
                  onChange={(e) => setCategoryFocus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.nameEn}>
                      {c.nameNe} ({c.nameEn})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  {lang === 'ne' ? 'फोन नम्बर (Private PII)' : 'Phone Number (Isolated PII)'}
                </label>
                <input
                  type="tel"
                  required
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  {lang === 'ne' ? 'प्यान / दर्ता नम्बर' : 'PAN / Registration No.'}
                </label>
                <input
                  type="text"
                  required
                  value={sellerPan}
                  onChange={(e) => setSellerPan(e.target.value)}
                  placeholder="60XXXXXXX"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl whitespace-nowrap"
                >
                  {lang === 'ne' ? 'विक्रेता प्रोफाइल सेभ गर्नुहोस्' : 'Submit Seller Registration'}
                </button>
              </div>
            </form>
          </div>

          {/* Add Product Price Listing for Seller */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {lang === 'ne'
                ? 'पसलको सामान र मूल्य थप्नुहोस् / अपडेट गर्नुहोस्'
                : 'Add or Update Seller Product Price'}
            </h3>
            <form onSubmit={handleSellerProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Select Product</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Your Shop Price (NPR)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={sellerOfferPrice}
                  onChange={(e) => setSellerOfferPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Stock Status</label>
                <select
                  value={sellerStock}
                  onChange={(e) =>
                    setSellerStock(e.target.value as 'in_stock' | 'limited' | 'out_of_stock')
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="limited">Limited Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Public Inquiry Contact Hint</label>
                <input
                  type="text"
                  value={inquiryPhoneHint}
                  onChange={(e) => setInquiryPhoneHint(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-xl whitespace-nowrap"
                >
                  {lang === 'ne' ? 'मूल्य प्रकाशित गर्नुहोस्' : 'Publish Seller Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: SECURE ADMIN PANEL */}
      {subTab === 'admin' && isAdmin && (
        <div className="space-y-6">
          {/* Database Seeding & Analytics Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Kati Paryo? Admin Control Center
                </h2>
                <p className="text-xs text-slate-500">
                  Authenticated via zero-trust Firestore rules ({currentUser?.email})
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await onAdminSeedDatabase();
                  setStatusMessage('Initial Nepal catalog seeded to live Firestore!');
                }}
                className="min-h-[42px] px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap self-start"
              >
                <Database className="w-4 h-4" />
                <span>
                  {isSeededInFirestore ? 'Re-Sync Seed Data to Firestore' : 'Seed Catalog to Firestore'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500">Products</div>
                <div className="text-xl font-bold text-slate-900 font-mono-num">{products.length}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500">Sellers</div>
                <div className="text-xl font-bold text-slate-900 font-mono-num">{sellers.length}</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500">User Price Reports</div>
                <div className="text-xl font-bold text-slate-900 font-mono-num">
                  {priceReports.length}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500">Flagged Reports</div>
                <div className="text-xl font-bold text-red-700 font-mono-num">
                  {flagReports.length}
                </div>
              </div>
            </div>
          </div>

          {/* Seller Approval & Verified Badge Management */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Manage Sellers & Verified Seller Badge Approval
            </h3>
            <div className="divide-y divide-slate-100">
              {sellers.map((s) => (
                <div
                  key={s.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {s.shopName} ({s.district})
                    </div>
                    <div className="text-xs text-slate-500">
                      {s.marketArea} · {s.categoryFocus} · Status: {s.status} · Verified:{' '}
                      {s.verified ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAdminVerifySeller(s, true, 'approved')}
                      className="min-h-[36px] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg whitespace-nowrap"
                    >
                      Approve & Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdminVerifySeller(s, false, 'rejected')}
                      className="min-h-[36px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg whitespace-nowrap"
                    >
                      Revoke / Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manage Categories */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Manage Product Categories ({categories.length})
            </h3>
            <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={newCatNe}
                onChange={(e) => setNewCatNe(e.target.value)}
                placeholder="नेपाली नाम (e.g. खेलकुद)"
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                required
                value={newCatEn}
                onChange={(e) => setNewCatEn(e.target.value)}
                placeholder="English Name (e.g. Sports)"
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                required
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
                placeholder="slug (e.g. sports-fitness)"
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono-num"
              />
              <button
                type="submit"
                className="min-h-[40px] px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </form>
          </div>

          {/* AdMob Placement Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              Google AdMob Units & Monetization Telemetry
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {ads.map((ad) => (
                <div key={ad.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{ad.title}</div>
                    <div className="text-slate-500 font-mono-num">{ad.adUnitId}</div>
                  </div>
                  <div className="text-right font-mono-num text-slate-700">
                    {ad.impressionsCount} impressions · {ad.clicksCount} clicks
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & PRIVACY CONTROLS */}
      {subTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            {lang === 'ne' ? 'एप सेटिङ्स र भाषा (App Settings)' : 'App Preferences & Account Settings'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                {lang === 'ne' ? 'भाषा छान्नुहोस् (Language)' : 'Select Language'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChangeLang('ne')}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    lang === 'ne'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  नेपाली (Default)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLang('en')}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    lang === 'en'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                {lang === 'ne'
                  ? 'तपाईंको जिल्ला / सहर (GPS बिना म्यानुअल छनौट)'
                  : 'Manual Nepal City / District (No GPS Tracking Required)'}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => onChangeDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white"
              >
                {NEPAL_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameNe} ({d.nameEn}) — {d.province}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notification Toggle */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {lang === 'ne'
                  ? 'मूल्य घटेको र अलर्ट नोटिफिकेसन (Price Drop Notifications)'
                  : 'Price-Drop & Seller Update Notifications'}
              </div>
              <div className="text-xs text-slate-500">
                {lang === 'ne'
                  ? 'तपाईंले सेभ गरेका सामानको मूल्य घट्दा जानकारी पाउनुहोस्'
                  : 'Receive alerts when saved products drop below your target price'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleNotifications(!notificationsEnabled)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                notificationsEnabled
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {notificationsEnabled ? 'Enabled' : 'Paused'}
            </button>
          </div>

          {/* Play Store Mandatory Account Deletion Option */}
          {currentUser && (
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="text-sm font-semibold text-red-700">
                {lang === 'ne'
                  ? 'खाता र व्यक्तिगत डेटा हटाउनुहोस् (Delete Account & Data)'
                  : 'Delete Account & Personal Data (Google Play Policy Compliance)'}
              </div>
              <p className="text-xs text-slate-600">
                {lang === 'ne'
                  ? 'तपाईंले कुनै पनि समयमा आफ्नो प्रोफाइल, सेभ गरिएका सामान र मूल्य अलर्ट स्थायी रूपमा मेटाउन सक्नुहुन्छ।'
                  : 'Permanently delete your Kati Paryo? user profile, saved items, and price alerts from Firestore.'}
              </p>
              {!confirmDeleteOpen ? (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="min-h-[42px] px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'मेरो खाता मेटाउनुहोस्' : 'Delete My Account'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onDeleteAccountData}
                    className="min-h-[42px] px-4 py-2 bg-red-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Confirm Permanent Deletion
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(false)}
                    className="min-h-[42px] px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PLAY STORE LEGAL PAGES & 7-STEP PRODUCTION SETUP GUIDE */}
      {subTab === 'legal' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              About “Kati Paryo?” — सामान किन्नुअघि, मूल्य थाहा पाऔँ।
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>Kati Paryo?</strong> helps consumers across Nepal discover and estimate fair
              market prices before purchasing electronics, laptops, kitchenware, groceries, auto
              parts, and construction materials. Every price is transparently labeled as{' '}
              <strong>Estimated</strong>, <strong>Seller Price</strong>, or{' '}
              <strong>User Reported</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-slate-600">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">Privacy Policy & Data Protection</div>
                <p>
                  We do not require precise GPS permissions; city/district selection is manual.
                  User emails and seller contact numbers are isolated in owner/admin-only Firestore
                  paths (`users/[uid]` and `sellers/[id]/private/contact`).
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">Terms of Use & Price Disclaimer</div>
                <p>
                  Estimated prices are generated from historical ranges and AI analysis and are
                  never guaranteed as final retail offers. Always verify the current price directly
                  with the shop before payment.
                </p>
              </div>
            </div>
          </div>

          {/* 7-Step Production Deployment & Play Store Guide */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Production Setup & Google Play Store Deployment Guide
            </h2>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">1. Backend (`server.ts`)</div>
                <p>
                  Express server running on port 3000 with rate-limited `/api/ai/scan-product` and
                  `/api/ai/scan-bill` routes. Start in production via `npm run build && npm start`.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">
                  2. Database & Security (`firestore.rules` & `firebase-blueprint.json`)
                </div>
                <p>
                  Provisioned on Firebase Firestore (`ai-studio-applet-webapp-69e85`). Zero-trust
                  ABAC security rules enforce strict schema validation, PII isolation, and role
                  checks.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">3. AI API (`@google/genai`)</div>
                <p>
                  Uses server-side `gemini-3.8-flash` with structured JSON schemas. Configure
                  `GEMINI_API_KEY` in the server environment secrets; never expose the key in
                  frontend code.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">4. Firebase Auth & Notifications</div>
                <p>
                  Enable Google Sign-In in the Firebase Console. For native Android push alerts,
                  attach Firebase Cloud Messaging (`google-services.json`) to the Android wrapper.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">
                  5. Google AdMob Configuration (`src/data/nepalData.ts`)
                </div>
                <p>
                  Currently configured with Google AdMob official Test IDs (App ID: {ADMOB_CONFIG.appId},
                  Banner: {ADMOB_CONFIG.bannerAdUnitId}). Before release, set
                  `VITE_ADMOB_APP_ID`, `VITE_ADMOB_BANNER_ID`, `VITE_ADMOB_INTERSTITIAL_ID`, and
                  `VITE_ADMOB_REWARDED_ID` in `.env`.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">
                  6 & 7. Production Build & Google Play Store Release
                </div>
                <p>
                  Run `npm run build` to generate the production bundle in `dist/`. Package as a
                  signed Android App Bundle (`.aab`) using Capacitor (`npx cap add android`) or
                  Bubblewrap TWA, sign with your upload keystore, and upload to Google Play Console
                  with the included Privacy Policy and Account Deletion flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
