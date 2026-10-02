import heroImg from '../assets/images/nepal_market_hero_1790944748084.jpg';
import phoneImg from '../assets/images/product_smartphone_nepal_1790944772340.jpg';
import laptopImg from '../assets/images/product_laptop_ultrabook_1790944785447.jpg';
import kitchenImg from '../assets/images/product_kitchen_appliances_1790944802324.jpg';
import helmetImg from '../assets/images/product_motorcycle_helmet_1790944816820.jpg';

export const ASSETS = {
  heroImg,
  phoneImg,
  laptopImg,
  kitchenImg,
  helmetImg,
};

export type Language = 'ne' | 'en';
export type PriceSourceType = 'Estimated' | 'Seller Price' | 'User Reported';

// Official Google AdMob Test IDs for development & Play Store verification.
// Replace via environment variables or Admin Ad Manager before Play Store release.
export const ADMOB_CONFIG = {
  appId: import.meta.env.VITE_ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713',
  bannerAdUnitId: import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111',
  interstitialAdUnitId: import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712',
  rewardedAdUnitId: import.meta.env.VITE_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917',
  isTestMode: !import.meta.env.VITE_ADMOB_APP_ID,
  interstitialSearchFrequency: 4, // Only trigger interstitial after 4 searches, never on every click
};

export const NEPAL_DISTRICTS: { id: string; nameEn: string; nameNe: string; province: string }[] = [
  { id: 'Kathmandu', nameEn: 'Kathmandu', nameNe: 'काठमाडौँ', province: 'Bagmati' },
  { id: 'Lalitpur', nameEn: 'Lalitpur', nameNe: 'ललितपुर', province: 'Bagmati' },
  { id: 'Bhaktapur', nameEn: 'Bhaktapur', nameNe: 'भक्तपुर', province: 'Bagmati' },
  { id: 'Pokhara', nameEn: 'Pokhara (Kaski)', nameNe: 'पोखरा (कास्की)', province: 'Gandaki' },
  { id: 'Chitwan', nameEn: 'Chitwan (Bharatpur)', nameNe: 'चितवन (भरतपुर)', province: 'Bagmati' },
  { id: 'Butwal', nameEn: 'Butwal (Rupandehi)', nameNe: 'बुटवल (रुपन्देही)', province: 'Lumbini' },
  { id: 'Dharan', nameEn: 'Dharan (Sunsari)', nameNe: 'धरान (सुनसरी)', province: 'Koshi' },
  { id: 'Biratnagar', nameEn: 'Biratnagar (Morang)', nameNe: 'विराटनगर (मोरङ)', province: 'Koshi' },
  { id: 'Nepalgunj', nameEn: 'Nepalgunj (Banke)', nameNe: 'नेपालगन्ज (बाँके)', province: 'Lumbini' },
  { id: 'Dhangadhi', nameEn: 'Dhangadhi (Kailali)', nameNe: 'धनगढी (कैलाली)', province: 'Sudurpashchim' },
  { id: 'Itahari', nameEn: 'Itahari', nameNe: 'इटहरी', province: 'Koshi' },
  { id: 'Birgunj', nameEn: 'Birgunj (Parsa)', nameNe: 'वीरगन्ज (पर्सा)', province: 'Madhesh' },
  { id: 'Janakpur', nameEn: 'Janakpur (Dhanusha)', nameNe: 'जनकपुर (धनुषा)', province: 'Madhesh' },
  { id: 'Hetauda', nameEn: 'Hetauda (Makwanpur)', nameNe: 'हेटौँडा (मकवानपुर)', province: 'Bagmati' },
  { id: 'Birtamode', nameEn: 'Birtamode (Jhapa)', nameNe: 'बिर्तामोड (झापा)', province: 'Koshi' },
  { id: 'Surkhet', nameEn: 'Birendranagar (Surkhet)', nameNe: 'वीरेन्द्रनगर (सुर्खेत)', province: 'Karnali' },
];

export interface CategoryItem {
  id: string;
  nameNe: string;
  nameEn: string;
  slug: string;
  iconName: string;
  sortOrder: number;
  visibility: 'public' | 'hidden';
}

export interface ProductItem {
  id: string;
  name: string;
  nameNe: string;
  brand: string;
  model: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  priceSource: PriceSourceType;
  confidenceScore: number;
  district: string;
  featured: boolean;
  sponsored: boolean;
  visibility: 'public' | 'hidden';
  createdBy: string;
  updatedAtLabel: string;
  priceDropPercent?: number;
  hasSufficientRecentData?: boolean;
}

export interface SellerItem {
  id: string;
  ownerId: string;
  shopName: string;
  district: string;
  marketArea: string;
  categoryFocus: string;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  visibility: 'public' | 'hidden';
  updatedAtLabel: string;
}

export interface SellerProductItem {
  id: string;
  sellerId: string;
  ownerId: string;
  shopName: string;
  district: string;
  verifiedSeller: boolean;
  productId: string;
  productName: string;
  price: number;
  stockStatus: 'in_stock' | 'limited' | 'out_of_stock';
  inquiryPhoneHint: string;
  visibility: 'public' | 'hidden';
  updatedAtLabel: string;
}

export interface PriceReportItem {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  pricePaid: number;
  quantity: number;
  district: string;
  shopName: string;
  purchaseDate: string;
  receiptUrl: string;
  status: 'approved' | 'pending' | 'flagged' | 'rejected';
  visibility: 'public' | 'hidden';
}

export interface PriceHistoryPoint {
  id: string;
  productId: string;
  dateLabel: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  sourceType: PriceSourceType;
  sampleCount: number;
  periodGroup: '30d' | '3m' | '6m' | '1y';
}

export interface SavedProductItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  brand: string;
  imageUrl: string;
  savedAtPrice: number;
  currentAvgPrice: number;
  alertEnabled: boolean;
  targetAlertPrice: number;
}

export interface PriceAlertItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  targetPrice: number;
  currentAvgPrice: number;
  district: string;
  status: 'active' | 'triggered' | 'paused';
}

export interface ReceiptItem {
  id: string;
  userId: string;
  shopName: string;
  district: string;
  billDate: string;
  totalAmount: number;
  itemsCount: number;
  summaryText: string;
  status: 'saved' | 'submitted';
}

export interface NotificationItem {
  id: string;
  userId: string;
  titleNe: string;
  titleEn: string;
  bodyNe: string;
  bodyEn: string;
  type: 'price_drop' | 'price_alert' | 'seller_update' | 'announcement';
  productId: string;
  isRead: boolean;
  visibility: 'public' | 'private';
  createdAtLabel: string;
}

export interface AdvertisementItem {
  id: string;
  title: string;
  placement: 'home_banner' | 'search_interstitial' | 'history_rewarded' | 'sponsored_card';
  adType: 'banner' | 'interstitial' | 'rewarded' | 'sponsored';
  adUnitId: string;
  sponsorName: string;
  ctaUrl: string;
  isActive: boolean;
  impressionsCount: number;
  clicksCount: number;
  visibility: 'public' | 'hidden';
}

export interface FlagReportItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  reportedPrice: number;
  reason: string;
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
}

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat_mobile', nameNe: 'मोबाइल र इलेक्ट्रोनिक्स', nameEn: 'Mobile & Electronics', slug: 'mobile-electronics', iconName: 'Smartphone', sortOrder: 1, visibility: 'public' },
  { id: 'cat_laptop', nameNe: 'ल्यापटप र कम्प्युटर', nameEn: 'Laptop & Computer', slug: 'laptop-computer', iconName: 'Laptop', sortOrder: 2, visibility: 'public' },
  { id: 'cat_tv', nameNe: 'टिभी र घरायसी उपकरण', nameEn: 'TV & Appliances', slug: 'tv-appliances', iconName: 'Tv', sortOrder: 3, visibility: 'public' },
  { id: 'cat_grocery', nameNe: 'किराना तथा खाद्यान्न', nameEn: 'Grocery', slug: 'grocery', iconName: 'ShoppingBag', sortOrder: 4, visibility: 'public' },
  { id: 'cat_clothing', nameNe: 'लत्ताकपडा', nameEn: 'Clothing', slug: 'clothing', iconName: 'Shirt', sortOrder: 5, visibility: 'public' },
  { id: 'cat_cosmetics', nameNe: 'सौन्दर्य सामग्री', nameEn: 'Cosmetics', slug: 'cosmetics', iconName: 'Sparkles', sortOrder: 6, visibility: 'public' },
  { id: 'cat_furniture', nameNe: 'फर्निचर', nameEn: 'Furniture', slug: 'furniture', iconName: 'Armchair', sortOrder: 7, visibility: 'public' },
  { id: 'cat_construction', nameNe: 'निर्माण सामग्री', nameEn: 'Construction Materials', slug: 'construction-materials', iconName: 'Hammer', sortOrder: 8, visibility: 'public' },
  { id: 'cat_auto', nameNe: 'मोटरसाइकल र अटो पार्ट्स', nameEn: 'Motorcycle & Auto Parts', slug: 'motorcycle-auto-parts', iconName: 'Bike', sortOrder: 9, visibility: 'public' },
  { id: 'cat_kitchen', nameNe: 'भान्साका सामान', nameEn: 'Kitchen Products', slug: 'kitchen-products', iconName: 'Utensils', sortOrder: 10, visibility: 'public' },
  { id: 'cat_home', nameNe: 'घरायसी सामान', nameEn: 'Home Products', slug: 'home-products', iconName: 'Home', sortOrder: 11, visibility: 'public' },
  { id: 'cat_other', nameNe: 'अन्य', nameEn: 'Other', slug: 'other', iconName: 'Package', sortOrder: 12, visibility: 'public' },
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod_redmi_note13',
    name: 'Redmi Note 13 4G (8GB / 256GB)',
    nameNe: 'रेडमी नोट १३ (8GB / 256GB)',
    brand: 'Xiaomi',
    model: 'Redmi Note 13',
    categoryId: 'cat_mobile',
    categoryName: 'Mobile & Electronics',
    imageUrl: phoneImg,
    minPrice: 23500,
    maxPrice: 25999,
    avgPrice: 24500,
    priceSource: 'Seller Price',
    confidenceScore: 94,
    district: 'Kathmandu',
    featured: true,
    sponsored: false,
    visibility: 'public',
    createdBy: 'system_seed',
    updatedAtLabel: '2026-10-01',
    priceDropPercent: 6,
    hasSufficientRecentData: true,
  },
  {
    id: 'prod_samsung_a15',
    name: 'Samsung Galaxy A15 5G (8GB / 128GB)',
    nameNe: 'सामसुङ ग्यालेक्सी A15 5G (8GB / 128GB)',
    brand: 'Samsung',
    model: 'Galaxy A15 5G',
    categoryId: 'cat_mobile',
    categoryName: 'Mobile & Electronics',
    imageUrl: phoneImg,
    minPrice: 27800,
    maxPrice: 29999,
    avgPrice: 28900,
    priceSource: 'Seller Price',
    confidenceScore: 92,
    district: 'Kathmandu',
    featured: true,
    sponsored: false,
    visibility: 'public',
    createdBy: 'system_seed',
    updatedAtLabel: '2026-10-01',
    priceDropPercent: 4,
    hasSufficientRecentData: true,
  },
  {
    id: 'prod_acer_aspire5',
    name: 'Acer Aspire 5 Intel Core i5 13th Gen (16GB / 512GB SSD)',
    nameNe: 'एसर एस्पायर ५ Core i5 13th Gen (16GB / 512GB)',
    brand: 'Acer',
    model: 'Aspire 5 A515-58M',
    categoryId: 'cat_laptop',
    categoryName: 'Laptop & Computer',
    imageUrl: laptopImg,
    minPrice: 76000,
    maxPrice: 82500,
    avgPrice: 78500,
    priceSource: 'User Reported',
    confidenceScore: 89,
    district: 'Kathmandu',
    featured: true,
    sponsored: false,
    visibility: 'public',
    createdBy: 'system_seed',
    updatedAtLabel: '2026-09-29',
    priceDropPercent: 5,
    hasSufficientRecentData: true,
  },
  {
    id: 'prod_macbook_air_m2',
    name: 'Apple MacBook Air M2 (8GB / 256GB, 13.6-inch)',
    nameNe: 'एप्पल म्याकबुक एयर M2 (8GB / 256GB)',
    brand: 'Apple',
    model: 'MacBook Air M2',
    categoryId: 'cat_laptop',
    categoryName: 'Laptop & Computer',
    imageUrl: laptopImg,
    minPrice: 136000,
    maxPrice: 145000,
    avgPrice: 139500,
    priceSource: 'Seller Price',
    confidenceScore: 91,
    district: 'Lalitpur',
    featured: true,
    sponsored: true,
    visibility: 'public',
    createdBy: 'system_seed',
    updatedAtLabel: '2026-10-01',
    priceDropPercent: 8,
    hasSufficientRecentData: true,
  },
  {
    id: 'prod_baltra_cooker_5l',
    name: 'Baltra Stainless Steel Induction Pressure Cooker (5 Litre)',
    nameNe: 'बाल्ट्रा स्टेनलेस स्टिल इन्डक्सन प्रेसर कुकर (५ लिटर)',
    brand: 'Baltra',
    model: 'BPC-502 Induction',
    categoryId: 'cat_kitchen',
    categoryName: 'Kitchen Products',
    imageUrl: kitchenImg,
    minPrice: 3100,
    maxPrice: 3650,
    avgPrice: 3350,
    priceSource: 'User Reported',
    confidenceScore: 88,
    district: 'Pokhara',
    featured: false,
    sponsored: false,
    visibility: 'public',
    createdBy: 'system_seed',
    updatedAtLabel: '2026-09-30',
    priceDropPercent: 7,
    hasSufficientRecentData: true,
  },
  {
    id: 'prod_cg_rice_cooker',
    name: 'CG 1.8L Electric Rice Cooker with Steamer (CG-RC18D)',
    nameNe: 'सिजी १.८ लिटर इलेक्ट्रिक राइस कुकर',
    brand: 'CG Electronics',
    model: 'CG-RC18D',
    categoryId: 'cat_kitchen',
    categoryName: 'Kitchen Products',
    imageUrl: kitchenImg,
    minPrice: 2650,
    maxPrice: 3100,
    avgPrice: 2850,
    priceSource: 'Seller Price',
    confidenceScore: 90,
    district: 'Chitwan',
    featured: false,
    sponsored: false,
    visibility: 'public',
    createdBy: 'system_seed',
    updatedAtLabel: '2026-09-28',
    hasSufficientRecentData: true,
  },
  {
    id: 'prod_studds_thunder_helmet',
    name: 'Studds Thunder D7 Full Face Motorcycle Helmet + Motul 7100 10W40',
    nameNe: 'स्टड्स थन्डर फुल फेस हेलमेट र मोटुल 7100 इन्जिन आयल',
    brand: 'Studds / Motul',
    model: 'Thunder D7 Combo',
    categoryId: 'cat_auto',
    categoryName: 'Motorcycle & Auto Parts',
    imageUrl: helmetImg,
    minPrice: 4600,
    maxPrice: 5200,
    avgPrice: 4850,
    priceSource: 'User Reported',
    confidenceScore: 86,
    district: 'Butwal',
    featured: true,
    sponsored: false,
    visibility: 'public',
    createdBy: 'system_seed',
    updatedAtLabel: '2026-09-27',
    priceDropPercent: 3,
    hasSufficientRecentData: true,
  },
  {
    id: 'prod_opc_cement_50kg',
    name: 'Shivam OPC Cement 53 Grade (50 KG Sack)',
    nameNe: 'शिवम् ओपिसी सिमेन्ट ५० केजी बोरा',
    brand: 'Shivam Cement',
    model: 'OPC 53 Grade 50kg',
    categoryId: 'cat_construction',
    categoryName: 'Construction Materials',
    imageUrl: helmetImg,
    minPrice: 715,
    maxPrice: 765,
    avgPrice: 740,
    priceSource: 'Estimated',
    confidenceScore: 79,
    district: 'Hetauda',
    featured: false,
    sponsored: false,
    visibility: 'public',
    createdBy: 'system_seed',
    updatedAtLabel: '2026-09-25',
    hasSufficientRecentData: false,
  },
  {
    id: 'prod_jira_masino_25kg',
    name: 'Thakali Long Grain Jira Masino Rice (25 KG Sack)',
    nameNe: 'जिरा मसिनो चामल (२५ केजी बोरा)',
    brand: 'Nepal Agro',
    model: 'Premium Jira Masino 25kg',
    categoryId: 'cat_grocery',
    categoryName: 'Grocery',
    imageUrl: kitchenImg,
    minPrice: 2250,
    maxPrice: 2550,
    avgPrice: 2380,
    priceSource: 'User Reported',
    confidenceScore: 93,
    district: 'Biratnagar',
    featured: false,
    sponsored: false,
    visibility: 'public',
    createdBy: 'system_seed',
    updatedAtLabel: '2026-10-01',
    priceDropPercent: 4,
    hasSufficientRecentData: true,
  },
];

export const INITIAL_SELLERS: SellerItem[] = [
  {
    id: 'seller_newroad_hub',
    ownerId: 'system_seed',
    shopName: 'Tamrakar Mobile & Gadget Hub',
    district: 'Kathmandu',
    marketArea: 'New Road, Pako (Tamrakar Complex)',
    categoryFocus: 'Mobile & Electronics',
    verified: true,
    status: 'approved',
    visibility: 'public',
    updatedAtLabel: '2026-10-01',
  },
  {
    id: 'seller_putalisadak_it',
    ownerId: 'system_seed',
    shopName: 'Himalayan IT & Laptop Traders',
    district: 'Kathmandu',
    marketArea: 'Putalisadak Computer Bazaar',
    categoryFocus: 'Laptop & Computer',
    verified: true,
    status: 'approved',
    visibility: 'public',
    updatedAtLabel: '2026-09-30',
  },
  {
    id: 'seller_pokhara_kitchen',
    ownerId: 'system_seed',
    shopName: 'Gandaki Home & Kitchen Emporium',
    district: 'Pokhara',
    marketArea: 'Chipledhunga, Mahendrapul',
    categoryFocus: 'Kitchen Products',
    verified: true,
    status: 'approved',
    visibility: 'public',
    updatedAtLabel: '2026-09-29',
  },
  {
    id: 'seller_butwal_auto',
    ownerId: 'system_seed',
    shopName: 'Lumbini Riders & Auto Parts',
    district: 'Butwal',
    marketArea: 'Traffic Chowk, Butwal',
    categoryFocus: 'Motorcycle & Auto Parts',
    verified: false,
    status: 'pending',
    visibility: 'public',
    updatedAtLabel: '2026-09-28',
  },
];

export const INITIAL_SELLER_PRODUCTS: SellerProductItem[] = [
  {
    id: 'sp_1',
    sellerId: 'seller_newroad_hub',
    ownerId: 'system_seed',
    shopName: 'Tamrakar Mobile & Gadget Hub',
    district: 'Kathmandu',
    verifiedSeller: true,
    productId: 'prod_redmi_note13',
    productName: 'Redmi Note 13 4G (8GB / 256GB)',
    price: 23999,
    stockStatus: 'in_stock',
    inquiryPhoneHint: '01-422XXXX / 98510XXXXX',
    visibility: 'public',
    updatedAtLabel: '2026-10-01',
  },
  {
    id: 'sp_2',
    sellerId: 'seller_newroad_hub',
    ownerId: 'system_seed',
    shopName: 'Tamrakar Mobile & Gadget Hub',
    district: 'Kathmandu',
    verifiedSeller: true,
    productId: 'prod_samsung_a15',
    productName: 'Samsung Galaxy A15 5G (8GB / 128GB)',
    price: 28200,
    stockStatus: 'in_stock',
    inquiryPhoneHint: '01-422XXXX / 98510XXXXX',
    visibility: 'public',
    updatedAtLabel: '2026-10-01',
  },
  {
    id: 'sp_3',
    sellerId: 'seller_putalisadak_it',
    ownerId: 'system_seed',
    shopName: 'Himalayan IT & Laptop Traders',
    district: 'Kathmandu',
    verifiedSeller: true,
    productId: 'prod_acer_aspire5',
    productName: 'Acer Aspire 5 Intel Core i5 13th Gen (16GB / 512GB SSD)',
    price: 77500,
    stockStatus: 'in_stock',
    inquiryPhoneHint: '01-443XXXX / 98011XXXXX',
    visibility: 'public',
    updatedAtLabel: '2026-09-30',
  },
  {
    id: 'sp_4',
    sellerId: 'seller_putalisadak_it',
    ownerId: 'system_seed',
    shopName: 'Himalayan IT & Laptop Traders',
    district: 'Kathmandu',
    verifiedSeller: true,
    productId: 'prod_macbook_air_m2',
    productName: 'Apple MacBook Air M2 (8GB / 256GB, 13.6-inch)',
    price: 137500,
    stockStatus: 'limited',
    inquiryPhoneHint: '01-443XXXX / 98011XXXXX',
    visibility: 'public',
    updatedAtLabel: '2026-10-01',
  },
  {
    id: 'sp_5',
    sellerId: 'seller_pokhara_kitchen',
    ownerId: 'system_seed',
    shopName: 'Gandaki Home & Kitchen Emporium',
    district: 'Pokhara',
    verifiedSeller: true,
    productId: 'prod_baltra_cooker_5l',
    productName: 'Baltra Stainless Steel Induction Pressure Cooker (5 Litre)',
    price: 3250,
    stockStatus: 'in_stock',
    inquiryPhoneHint: '061-53XXXX / 98460XXXXX',
    visibility: 'public',
    updatedAtLabel: '2026-09-29',
  },
  {
    id: 'sp_6',
    sellerId: 'seller_butwal_auto',
    ownerId: 'system_seed',
    shopName: 'Lumbini Riders & Auto Parts',
    district: 'Butwal',
    verifiedSeller: false,
    productId: 'prod_studds_thunder_helmet',
    productName: 'Studds Thunder D7 Full Face Motorcycle Helmet + Motul 7100 10W40',
    price: 4750,
    stockStatus: 'in_stock',
    inquiryPhoneHint: '071-54XXXX / 98570XXXXX',
    visibility: 'public',
    updatedAtLabel: '2026-09-28',
  },
];

export const INITIAL_PRICE_REPORTS: PriceReportItem[] = [
  {
    id: 'pr_1',
    userId: 'system_seed',
    userName: 'सुमन श्रेष्ठ (Suman S.)',
    productId: 'prod_redmi_note13',
    productName: 'Redmi Note 13 4G (8GB / 256GB)',
    pricePaid: 24200,
    quantity: 1,
    district: 'Kathmandu',
    shopName: 'Pako Mobile Arcade',
    purchaseDate: '2026-09-28',
    receiptUrl: '',
    status: 'approved',
    visibility: 'public',
  },
  {
    id: 'pr_2',
    userId: 'system_seed',
    userName: 'अनिता गुरुङ (Anita G.)',
    productId: 'prod_baltra_cooker_5l',
    productName: 'Baltra Stainless Steel Induction Pressure Cooker (5 Litre)',
    pricePaid: 3300,
    quantity: 1,
    district: 'Pokhara',
    shopName: 'Mahendrapul Utensil House',
    purchaseDate: '2026-09-26',
    receiptUrl: '',
    status: 'approved',
    visibility: 'public',
  },
  {
    id: 'pr_3',
    userId: 'system_seed',
    userName: 'विकास अधिकारी (Bikash A.)',
    productId: 'prod_acer_aspire5',
    productName: 'Acer Aspire 5 Intel Core i5 13th Gen (16GB / 512GB SSD)',
    pricePaid: 78000,
    quantity: 1,
    district: 'Chitwan',
    shopName: 'Narayangarh Tech Zone',
    purchaseDate: '2026-09-24',
    receiptUrl: '',
    status: 'approved',
    visibility: 'public',
  },
];

export const INITIAL_PRICE_HISTORY: PriceHistoryPoint[] = [
  // Redmi Note 13
  { id: 'ph_1', productId: 'prod_redmi_note13', dateLabel: '2025-11', minPrice: 26500, avgPrice: 27999, maxPrice: 28999, sourceType: 'Seller Price', sampleCount: 18, periodGroup: '1y' },
  { id: 'ph_2', productId: 'prod_redmi_note13', dateLabel: '2026-04', minPrice: 25500, avgPrice: 26800, maxPrice: 27999, sourceType: 'Seller Price', sampleCount: 24, periodGroup: '6m' },
  { id: 'ph_3', productId: 'prod_redmi_note13', dateLabel: '2026-07', minPrice: 24500, avgPrice: 25600, maxPrice: 26500, sourceType: 'User Reported', sampleCount: 31, periodGroup: '3m' },
  { id: 'ph_4', productId: 'prod_redmi_note13', dateLabel: '2026-09', minPrice: 23800, avgPrice: 24900, maxPrice: 25999, sourceType: 'User Reported', sampleCount: 42, periodGroup: '30d' },
  { id: 'ph_5', productId: 'prod_redmi_note13', dateLabel: '2026-10', minPrice: 23500, avgPrice: 24500, maxPrice: 25999, sourceType: 'Seller Price', sampleCount: 49, periodGroup: '30d' },

  // Acer Aspire 5
  { id: 'ph_6', productId: 'prod_acer_aspire5', dateLabel: '2025-12', minPrice: 82000, avgPrice: 84500, maxPrice: 87000, sourceType: 'Seller Price', sampleCount: 11, periodGroup: '1y' },
  { id: 'ph_7', productId: 'prod_acer_aspire5', dateLabel: '2026-05', minPrice: 79500, avgPrice: 82000, maxPrice: 84500, sourceType: 'User Reported', sampleCount: 16, periodGroup: '6m' },
  { id: 'ph_8', productId: 'prod_acer_aspire5', dateLabel: '2026-08', minPrice: 77500, avgPrice: 79800, maxPrice: 83000, sourceType: 'Seller Price', sampleCount: 22, periodGroup: '3m' },
  { id: 'ph_9', productId: 'prod_acer_aspire5', dateLabel: '2026-10', minPrice: 76000, avgPrice: 78500, maxPrice: 82500, sourceType: 'User Reported', sampleCount: 29, periodGroup: '30d' },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'broadcast',
    titleNe: 'मूल्य घट्यो: Redmi Note 13 (8/256GB)',
    titleEn: 'Price Drop: Redmi Note 13 (8/256GB)',
    bodyNe: 'काठमाडौँ न्यूरोडमा Redmi Note 13 को विक्रेता मूल्य रु. २३,९९९ मा झरेको छ।',
    bodyEn: 'Verified seller price in New Road Kathmandu dropped to Rs. 23,999.',
    type: 'price_drop',
    productId: 'prod_redmi_note13',
    isRead: false,
    visibility: 'public',
    createdAtLabel: '२ घण्टा अघि',
  },
  {
    id: 'notif_2',
    userId: 'broadcast',
    titleNe: 'दशैँ–तिहार विशेष बजार मूल्य अपडेट',
    titleEn: 'Festive Nepal Market Price Update',
    bodyNe: 'सामान किन्नुअघि बिल वा सामानको फोटो स्क्यान गरी वास्तविक बजार मूल्य तुलना गर्नुहोस्।',
    bodyEn: 'Scan product photos or receipts before shopping to compare verified seller and user-reported prices.',
    type: 'announcement',
    productId: 'prod_acer_aspire5',
    isRead: false,
    visibility: 'public',
    createdAtLabel: '१ दिन अघि',
  },
];

export const INITIAL_ADS: AdvertisementItem[] = [
  {
    id: 'ad_home_banner',
    title: 'Google AdMob Adaptive Banner (Test Unit)',
    placement: 'home_banner',
    adType: 'banner',
    adUnitId: ADMOB_CONFIG.bannerAdUnitId,
    sponsorName: 'Google AdMob Nepal Test Network',
    ctaUrl: 'https://admob.google.com',
    isActive: true,
    impressionsCount: 1420,
    clicksCount: 64,
    visibility: 'public',
  },
  {
    id: 'ad_search_interstitial',
    title: 'Google AdMob Natural Search Interstitial (Test Unit)',
    placement: 'search_interstitial',
    adType: 'interstitial',
    adUnitId: ADMOB_CONFIG.interstitialAdUnitId,
    sponsorName: 'Google AdMob Interstitial Test',
    ctaUrl: 'https://admob.google.com',
    isActive: true,
    impressionsCount: 310,
    clicksCount: 28,
    visibility: 'public',
  },
  {
    id: 'ad_history_rewarded',
    title: 'Google AdMob Rewarded Price History Unlock (Test Unit)',
    placement: 'history_rewarded',
    adType: 'rewarded',
    adUnitId: ADMOB_CONFIG.rewardedAdUnitId,
    sponsorName: 'Google AdMob Rewarded Test',
    ctaUrl: 'https://admob.google.com',
    isActive: true,
    impressionsCount: 495,
    clicksCount: 112,
    visibility: 'public',
  },
];

export function formatNpr(amount: number): string {
  if (!Number.isFinite(amount)) return 'Rs. 0';
  return 'Rs. ' + Math.round(amount).toLocaleString('en-IN');
}

export const UI_STRINGS = {
  ne: {
    appName: 'Kati Paryo?',
    appNameNe: 'कति पर्यो?',
    tagline: 'सामान किन्नुअघि, मूल्य थाहा पाऔँ।',
    searchPlaceholder: 'कुन सामानको मूल्य जान्न चाहनुहुन्छ?',
    scanPhotoBtn: 'फोटोबाट खोज्नुहोस्',
    scanBillBtn: 'बिल / रसिद स्क्यान',
    categoriesTitle: 'सामानका श्रेणीहरू',
    popularProducts: 'चर्चित सामानहरू',
    recentlyViewed: 'भर्खरै हेरिएका',
    priceDrops: 'मूल्य घटेका सामानहरू',
    nearbySellers: 'नजिकका प्रमाणित पसलहरू',
    navHome: 'गृहपृष्ठ',
    navSearch: 'खोज्नुहोस्',
    navScan: 'स्क्यान',
    navSaved: 'सेभ गरिएका',
    navProfile: 'प्रोफाइल',
    estimatedLabel: 'अनुमानित मूल्य (Estimated)',
    sellerPriceLabel: 'पसलको मूल्य (Seller Price)',
    userReportedLabel: 'ग्राहकले तिरेको (User Reported)',
    insufficientDataMsg: 'पर्याप्त नयाँ मूल्य डेटा उपलब्ध छैन।',
    unavailablePriceMsg: 'माफ गर्नुहोस्, अहिले मूल्यको जानकारी उपलब्ध छैन।',
    tryAgainMsg: 'फेरि प्रयास गर्नुहोस्।',
    unidentifiedProductMsg: 'यो सामान पहिचान गर्न सकिएन। कृपया नाम वा brand manually छान्नुहोस्।',
    verifyDisclaimer: 'ध्यान दिनुहोस्: अनुमानित मूल्य ग्यारेन्टी गरिएको मूल्य होइन। खरिद गर्नुअघि पसलको वास्तविक मूल्य जाँच गर्नुहोस्।',
    submitPriceBtn: 'मैले तिरेको मूल्य थप्नुहोस्',
    setAlertBtn: 'मूल्य घटेमा जानकारी पाउनुहोस्',
    reportIncorrectBtn: 'गलत मूल्य रिपोर्ट गर्नुहोस्',
    unlockHistoryAd: 'विस्तृत १ वर्षको मूल्य इतिहास हेर्न छोटो विज्ञापन हेर्नुहोस् (Rewarded Ad)',
  },
  en: {
    appName: 'Kati Paryo?',
    appNameNe: 'कति पर्यो?',
    tagline: 'Know the real Nepal market price before you buy.',
    searchPlaceholder: 'Which product price do you want to check?',
    scanPhotoBtn: 'Scan by Photo',
    scanBillBtn: 'Scan Receipt / Bill',
    categoriesTitle: 'Product Categories',
    popularProducts: 'Popular Products',
    recentlyViewed: 'Recently Viewed',
    priceDrops: 'Recent Price Drops',
    nearbySellers: 'Nearby Sellers in Nepal',
    navHome: 'Home',
    navSearch: 'Search',
    navScan: 'Scan',
    navSaved: 'Saved',
    navProfile: 'Profile',
    estimatedLabel: 'Estimated',
    sellerPriceLabel: 'Seller Price',
    userReportedLabel: 'User Reported',
    insufficientDataMsg: 'पर्याप्त नयाँ मूल्य डेटा उपलब्ध छैन। (Insufficient recent price data.)',
    unavailablePriceMsg: 'माफ गर्नुहोस्, अहिले मूल्यको जानकारी उपलब्ध छैन। (Price info currently unavailable.)',
    tryAgainMsg: 'फेरि प्रयास गर्नुहोस्। (Please try again.)',
    unidentifiedProductMsg: 'यो सामान पहिचान गर्न सकिएन। कृपया नाम वा brand manually छान्नुहोस्।',
    verifyDisclaimer: 'Note: Estimated prices are never guaranteed unless backed by a verified seller or recent user report. Always verify with the seller.',
    submitPriceBtn: 'Submit Price I Paid',
    setAlertBtn: 'Set Price Drop Alert',
    reportIncorrectBtn: 'Report Incorrect Price',
    unlockHistoryAd: 'Watch a short ad to unlock full 1-year price history (Rewarded Ad)',
  },
};
