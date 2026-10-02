import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import {
  CategoryItem,
  ProductItem,
  SellerItem,
  SellerProductItem,
  PriceReportItem,
  PriceHistoryPoint,
  SavedProductItem,
  PriceAlertItem,
  ReceiptItem,
  NotificationItem,
  AdvertisementItem,
  FlagReportItem,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SELLERS,
  INITIAL_SELLER_PRODUCTS,
  INITIAL_PRICE_REPORTS,
  INITIAL_PRICE_HISTORY,
  INITIAL_NOTIFICATIONS,
  INITIAL_ADS,
} from '../data/nepalData';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || 'id_' + Date.now();
}

function clampStr(str: string, minLen: number, maxLen: number, fallback = 'N/A'): string {
  const trimmed = (str || '').trim();
  if (trimmed.length < minLen) return fallback.slice(0, maxLen);
  return trimmed.slice(0, maxLen);
}

// Fetch public catalog collections from Firestore with automatic fallback to initial seed data
export async function fetchPublicCatalog() {
  try {
    const [catSnap, prodSnap, sellerSnap, spSnap, prSnap, phSnap, notifSnap, adSnap] = await Promise.all([
      getDocs(query(collection(db, 'categories'), where('visibility', '==', 'public'))),
      getDocs(query(collection(db, 'products'), where('visibility', '==', 'public'))),
      getDocs(query(collection(db, 'sellers'), where('visibility', '==', 'public'))),
      getDocs(query(collection(db, 'seller_products'), where('visibility', '==', 'public'))),
      getDocs(query(collection(db, 'price_reports'), where('visibility', '==', 'public'))),
      getDocs(query(collection(db, 'price_history'), where('visibility', '==', 'public'))),
      getDocs(query(collection(db, 'notifications'), where('visibility', '==', 'public'))),
      getDocs(query(collection(db, 'advertisements'), where('visibility', '==', 'public'))),
    ]);

    const categories: CategoryItem[] = catSnap.empty
      ? INITIAL_CATEGORIES
      : catSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<CategoryItem, 'id'>) }))
          .sort((a, b) => a.sortOrder - b.sortOrder);

    const products: ProductItem[] = prodSnap.empty
      ? INITIAL_PRODUCTS
      : prodSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            nameNe: data.nameNe,
            brand: data.brand,
            model: data.model,
            categoryId: data.categoryId,
            categoryName: data.categoryName,
            imageUrl: data.imageUrl,
            minPrice: Number(data.minPrice),
            maxPrice: Number(data.maxPrice),
            avgPrice: Number(data.avgPrice),
            priceSource: data.priceSource,
            confidenceScore: Number(data.confidenceScore),
            district: data.district,
            featured: Boolean(data.featured),
            sponsored: Boolean(data.sponsored),
            visibility: data.visibility,
            createdBy: data.createdBy,
            updatedAtLabel: '2026-10-02',
            hasSufficientRecentData: Number(data.confidenceScore) >= 80,
          };
        });

    const sellers: SellerItem[] = sellerSnap.empty
      ? INITIAL_SELLERS
      : sellerSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerId: data.ownerId,
            shopName: data.shopName,
            district: data.district,
            marketArea: data.marketArea,
            categoryFocus: data.categoryFocus,
            verified: Boolean(data.verified),
            status: data.status,
            visibility: data.visibility,
            updatedAtLabel: '2026-10-02',
          };
        });

    const sellerProducts: SellerProductItem[] = spSnap.empty
      ? INITIAL_SELLER_PRODUCTS
      : spSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            sellerId: data.sellerId,
            ownerId: data.ownerId,
            shopName: data.shopName,
            district: data.district,
            verifiedSeller: Boolean(data.verifiedSeller),
            productId: data.productId,
            productName: data.productName,
            price: Number(data.price),
            stockStatus: data.stockStatus,
            inquiryPhoneHint: data.inquiryPhoneHint,
            visibility: data.visibility,
            updatedAtLabel: '2026-10-02',
          };
        });

    const priceReports: PriceReportItem[] = prSnap.empty
      ? INITIAL_PRICE_REPORTS
      : prSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PriceReportItem, 'id'>),
        }));

    const priceHistory: PriceHistoryPoint[] = phSnap.empty
      ? INITIAL_PRICE_HISTORY
      : phSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            productId: data.productId,
            dateLabel: data.dateLabel,
            minPrice: Number(data.minPrice),
            avgPrice: Number(data.avgPrice),
            maxPrice: Number(data.maxPrice),
            sourceType: data.sourceType,
            sampleCount: Number(data.sampleCount),
            periodGroup: '30d',
          };
        });

    const notifications: NotificationItem[] = notifSnap.empty
      ? INITIAL_NOTIFICATIONS
      : notifSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            titleNe: data.titleNe,
            titleEn: data.titleEn,
            bodyNe: data.bodyNe,
            bodyEn: data.bodyEn,
            type: data.type,
            productId: data.productId,
            isRead: Boolean(data.isRead),
            visibility: data.visibility,
            createdAtLabel: 'भर्खरै',
          };
        });

    const ads: AdvertisementItem[] = adSnap.empty
      ? INITIAL_ADS
      : adSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AdvertisementItem, 'id'>),
        }));

    return {
      categories,
      products,
      sellers,
      sellerProducts,
      priceReports,
      priceHistory,
      notifications,
      ads,
      isSeededInFirestore: !catSnap.empty,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'public_catalog');
  }
}

// Ensure authenticated user profile exists in /users/{uid}
export async function ensureUserProfile(
  uid: string,
  displayName: string,
  email: string,
  district = 'Kathmandu',
  language: 'ne' | 'en' = 'ne'
) {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const isAdminEmail = email === 'rokeyghimire530@gmail.com';
      await setDoc(userRef, {
        uid: sanitizeId(uid),
        displayName: clampStr(displayName || 'Nepal User', 1, 100, 'Nepal User'),
        email: clampStr(email, 3, 254, 'user@example.com'),
        district: clampStr(district, 2, 60, 'Kathmandu'),
        language: language === 'en' ? 'en' : 'ne',
        role: isAdminEmail ? 'admin' : 'user',
        notificationsEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    const freshSnap = await getDoc(userRef);
    return freshSnap.data();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch user-owned collections (SavedProducts, PriceAlerts, Receipts, FlagReports)
export async function fetchUserPrivateCollections(uid: string) {
  try {
    const [savedSnap, alertSnap, receiptSnap, flagSnap] = await Promise.all([
      getDocs(query(collection(db, 'saved_products'), where('userId', '==', uid))),
      getDocs(query(collection(db, 'price_alerts'), where('userId', '==', uid))),
      getDocs(query(collection(db, 'receipts'), where('userId', '==', uid))),
      getDocs(query(collection(db, 'reports'), where('userId', '==', uid))),
    ]);

    const savedProducts: SavedProductItem[] = savedSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<SavedProductItem, 'id'>),
    }));

    const priceAlerts: PriceAlertItem[] = alertSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<PriceAlertItem, 'id'>),
    }));

    const receipts: ReceiptItem[] = receiptSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ReceiptItem, 'id'>),
    }));

    const flagReports: FlagReportItem[] = flagSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FlagReportItem, 'id'>),
    }));

    return { savedProducts, priceAlerts, receipts, flagReports };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'user_private_collections');
  }
}

// Save or unsave a product in /saved_products/{savedId}
export async function saveProductForUser(product: ProductItem, targetAlertPrice?: number) {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  const savedId = sanitizeId(`${user.uid}_${product.id}`);
  const path = `saved_products/${savedId}`;
  try {
    // Ensure product exists in Firestore before creating relational SavedProduct
    await ensureProductInFirestore(product);
    await setDoc(doc(db, 'saved_products', savedId), {
      userId: sanitizeId(user.uid),
      productId: sanitizeId(product.id),
      productName: clampStr(product.name, 1, 140),
      brand: clampStr(product.brand, 1, 80),
      imageUrl: clampStr(product.imageUrl, 1, 500),
      savedAtPrice: Math.max(0, Math.round(product.avgPrice)),
      currentAvgPrice: Math.max(0, Math.round(product.avgPrice)),
      alertEnabled: Boolean(targetAlertPrice && targetAlertPrice > 0),
      targetAlertPrice: targetAlertPrice ? Math.max(0, Math.round(targetAlertPrice)) : Math.round(product.minPrice),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return savedId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeSavedProductForUser(savedId: string) {
  const path = `saved_products/${savedId}`;
  try {
    await deleteDoc(doc(db, 'saved_products', savedId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Create a price drop alert in /price_alerts/{alertId}
export async function createPriceAlertForUser(
  product: ProductItem,
  targetPrice: number,
  district: string
) {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  const alertId = sanitizeId(`alert_${user.uid}_${product.id}`);
  const path = `price_alerts/${alertId}`;
  try {
    await ensureProductInFirestore(product);
    await setDoc(doc(db, 'price_alerts', alertId), {
      userId: sanitizeId(user.uid),
      productId: sanitizeId(product.id),
      productName: clampStr(product.name, 1, 140),
      targetPrice: Math.max(1, Math.round(targetPrice)),
      currentAvgPrice: Math.max(0, Math.round(product.avgPrice)),
      district: clampStr(district, 2, 60, 'Kathmandu'),
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return alertId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Ensure category & product exist in Firestore so relational exists() checks pass
export async function ensureProductInFirestore(product: ProductItem) {
  const user = auth.currentUser;
  if (!user) return;
  const prodId = sanitizeId(product.id);
  const prodRef = doc(db, 'products', prodId);
  const snap = await getDoc(prodRef);
  if (snap.exists()) return;

  // Ensure category exists first if admin, or if not exists
  const catId = sanitizeId(product.categoryId || 'cat_other');
  const catRef = doc(db, 'categories', catId);
  const catSnap = await getDoc(catRef);
  if (!catSnap.exists() && user.email === 'rokeyghimire530@gmail.com') {
    const seedCat = INITIAL_CATEGORIES.find((c) => c.id === catId) || INITIAL_CATEGORIES[0];
    await setDoc(catRef, {
      nameNe: clampStr(seedCat.nameNe, 1, 80),
      nameEn: clampStr(seedCat.nameEn, 1, 80),
      slug: sanitizeId(seedCat.slug),
      iconName: clampStr(seedCat.iconName, 1, 40),
      sortOrder: seedCat.sortOrder,
      visibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (catSnap.exists() || user.email === 'rokeyghimire530@gmail.com') {
    await setDoc(prodRef, {
      name: clampStr(product.name, 1, 140),
      nameNe: clampStr(product.nameNe || product.name, 1, 140),
      brand: clampStr(product.brand, 1, 80),
      model: clampStr(product.model, 1, 80),
      categoryId: catId,
      categoryName: clampStr(product.categoryName, 1, 80),
      imageUrl: clampStr(product.imageUrl, 1, 500),
      minPrice: Math.max(0, Math.round(product.minPrice)),
      maxPrice: Math.max(Math.round(product.minPrice), Math.round(product.maxPrice)),
      avgPrice: Math.min(
        Math.max(Math.round(product.minPrice), Math.round(product.avgPrice)),
        Math.max(Math.round(product.minPrice), Math.round(product.maxPrice))
      ),
      priceSource: product.priceSource,
      confidenceScore: Math.min(100, Math.max(0, Math.round(product.confidenceScore))),
      district: clampStr(product.district, 2, 60, 'Kathmandu'),
      featured: false,
      sponsored: false,
      visibility: 'public',
      createdBy: sanitizeId(user.uid),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// Submit User Price Report in /price_reports/{reportId}
export async function submitUserPriceReport(params: {
  product: ProductItem;
  pricePaid: number;
  quantity: number;
  district: string;
  shopName: string;
  purchaseDate: string;
  receiptUrl?: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  const reportId = sanitizeId(`pr_${user.uid}_${Date.now()}`);
  const path = `price_reports/${reportId}`;
  try {
    await ensureProductInFirestore(params.product);
    // Suspicious submission check: if price deviates > 55% from current avgPrice, mark 'pending' for admin moderation
    const deviation = Math.abs(params.pricePaid - params.product.avgPrice) / Math.max(1, params.product.avgPrice);
    const initialStatus = deviation > 0.55 ? 'pending' : 'approved';

    await setDoc(doc(db, 'price_reports', reportId), {
      userId: sanitizeId(user.uid),
      userName: clampStr(user.displayName || 'नेपाली उपभोक्ता', 1, 80),
      productId: sanitizeId(params.product.id),
      productName: clampStr(params.product.name, 1, 140),
      pricePaid: Math.max(1, Math.round(params.pricePaid)),
      quantity: Math.max(1, Math.min(10000, Math.round(params.quantity))),
      district: clampStr(params.district, 2, 60, 'Kathmandu'),
      shopName: clampStr(params.shopName || 'Local Market Shop', 1, 120),
      purchaseDate: clampStr(params.purchaseDate || '2026-10-02', 4, 30),
      receiptUrl: clampStr(params.receiptUrl || '', 0, 500, ''),
      status: initialStatus,
      visibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { reportId, status: initialStatus };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Register a Seller Profile + Isolated Private Contact Info (/sellers/{sellerId} + /sellers/{sellerId}/private/contact)
export async function registerSellerAccount(params: {
  shopName: string;
  district: string;
  marketArea: string;
  categoryFocus: string;
  phone: string;
  panNumber: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  const sellerId = sanitizeId(`seller_${user.uid}`);
  const path = `sellers/${sellerId}`;
  try {
    await setDoc(doc(db, 'sellers', sellerId), {
      ownerId: sanitizeId(user.uid),
      shopName: clampStr(params.shopName, 2, 120),
      district: clampStr(params.district, 2, 60, 'Kathmandu'),
      marketArea: clampStr(params.marketArea, 2, 120),
      categoryFocus: clampStr(params.categoryFocus, 2, 80),
      verified: false, // Admin must approve verified seller badge
      status: 'pending',
      visibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Save isolated PII in /sellers/{sellerId}/private/contact
    await setDoc(doc(db, 'sellers', sellerId, 'private', 'contact'), {
      ownerId: sanitizeId(user.uid),
      sellerId,
      phone: clampStr(params.phone, 7, 20),
      email: clampStr(user.email || 'seller@example.com', 3, 254),
      panNumber: clampStr(params.panNumber || 'PENDING', 1, 30),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return sellerId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Add Seller Product Price Listing (/seller_products/{spId})
export async function createSellerProductListing(params: {
  seller: SellerItem;
  product: ProductItem;
  price: number;
  stockStatus: 'in_stock' | 'limited' | 'out_of_stock';
  inquiryPhoneHint: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  const spId = sanitizeId(`sp_${params.seller.id}_${params.product.id}`);
  const path = `seller_products/${spId}`;
  try {
    await ensureProductInFirestore(params.product);
    await setDoc(doc(db, 'seller_products', spId), {
      sellerId: sanitizeId(params.seller.id),
      ownerId: sanitizeId(user.uid),
      shopName: clampStr(params.seller.shopName, 2, 120),
      district: clampStr(params.seller.district, 2, 60),
      verifiedSeller: Boolean(params.seller.verified),
      productId: sanitizeId(params.product.id),
      productName: clampStr(params.product.name, 1, 140),
      price: Math.max(1, Math.round(params.price)),
      stockStatus: params.stockStatus,
      inquiryPhoneHint: clampStr(params.inquiryPhoneHint, 4, 30, '98XXXXXXXX'),
      visibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return spId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Save Scanned Bill/Receipt in /receipts/{receiptId}
export async function saveScannedReceipt(params: {
  shopName: string;
  district: string;
  billDate: string;
  totalAmount: number;
  itemsCount: number;
  summaryText: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  const receiptId = sanitizeId(`rcpt_${user.uid}_${Date.now()}`);
  const path = `receipts/${receiptId}`;
  try {
    await setDoc(doc(db, 'receipts', receiptId), {
      userId: sanitizeId(user.uid),
      shopName: clampStr(params.shopName || 'Nepal Retail Store', 1, 120),
      district: clampStr(params.district || 'Kathmandu', 2, 60),
      billDate: clampStr(params.billDate || '2026-10-02', 4, 30),
      totalAmount: Math.max(0, Math.round(params.totalAmount)),
      itemsCount: Math.max(1, Math.min(500, Math.round(params.itemsCount))),
      summaryText: clampStr(params.summaryText, 1, 1000),
      status: 'saved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return receiptId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Report Incorrect Price in /reports/{flagId}
export async function submitIncorrectPriceFlag(params: {
  product: ProductItem;
  reportedPrice: number;
  reason: string;
  details: string;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  const flagId = sanitizeId(`flag_${user.uid}_${Date.now()}`);
  const path = `reports/${flagId}`;
  try {
    await ensureProductInFirestore(params.product);
    await setDoc(doc(db, 'reports', flagId), {
      userId: sanitizeId(user.uid),
      productId: sanitizeId(params.product.id),
      productName: clampStr(params.product.name, 1, 140),
      reportedPrice: Math.max(0, Math.round(params.reportedPrice)),
      reason: clampStr(params.reason, 2, 100),
      details: clampStr(params.details, 2, 500),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return flagId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Admin: Seed Initial Nepal Catalog into Firestore
export async function seedInitialCatalogToFirestore() {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');
  try {
    for (const cat of INITIAL_CATEGORIES) {
      await setDoc(doc(db, 'categories', sanitizeId(cat.id)), {
        nameNe: clampStr(cat.nameNe, 1, 80),
        nameEn: clampStr(cat.nameEn, 1, 80),
        slug: sanitizeId(cat.slug),
        iconName: clampStr(cat.iconName, 1, 40),
        sortOrder: cat.sortOrder,
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const prod of INITIAL_PRODUCTS) {
      await setDoc(doc(db, 'products', sanitizeId(prod.id)), {
        name: clampStr(prod.name, 1, 140),
        nameNe: clampStr(prod.nameNe, 1, 140),
        brand: clampStr(prod.brand, 1, 80),
        model: clampStr(prod.model, 1, 80),
        categoryId: sanitizeId(prod.categoryId),
        categoryName: clampStr(prod.categoryName, 1, 80),
        imageUrl: clampStr(prod.imageUrl, 1, 500),
        minPrice: prod.minPrice,
        maxPrice: prod.maxPrice,
        avgPrice: prod.avgPrice,
        priceSource: prod.priceSource,
        confidenceScore: prod.confidenceScore,
        district: clampStr(prod.district, 2, 60),
        featured: Boolean(prod.featured),
        sponsored: Boolean(prod.sponsored),
        visibility: 'public',
        createdBy: sanitizeId(user.uid),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const ad of INITIAL_ADS) {
      await setDoc(doc(db, 'advertisements', sanitizeId(ad.id)), {
        title: clampStr(ad.title, 1, 120),
        placement: ad.placement,
        adType: ad.adType,
        adUnitId: clampStr(ad.adUnitId, 5, 120),
        sponsorName: clampStr(ad.sponsorName, 1, 100),
        ctaUrl: clampStr(ad.ctaUrl, 1, 500),
        isActive: ad.isActive,
        impressionsCount: ad.impressionsCount,
        clicksCount: ad.clicksCount,
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const notif of INITIAL_NOTIFICATIONS) {
      await setDoc(doc(db, 'notifications', sanitizeId(notif.id)), {
        userId: sanitizeId(user.uid),
        titleNe: clampStr(notif.titleNe, 1, 140),
        titleEn: clampStr(notif.titleEn, 1, 140),
        bodyNe: clampStr(notif.bodyNe, 1, 500),
        bodyEn: clampStr(notif.bodyEn, 1, 500),
        type: notif.type,
        productId: sanitizeId(notif.productId),
        isRead: false,
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed_catalog');
  }
}

// Admin: Approve or Reject a Seller & Verified Badge
export async function adminUpdateSellerVerification(
  seller: SellerItem,
  verified: boolean,
  status: 'approved' | 'rejected' | 'pending'
) {
  const path = `sellers/${seller.id}`;
  try {
    const sellerRef = doc(db, 'sellers', sanitizeId(seller.id));
    const snap = await getDoc(sellerRef);
    if (snap.exists()) {
      await updateDoc(sellerRef, {
        verified,
        status,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Admin: Add a new Category
export async function adminCreateCategory(params: {
  nameNe: string;
  nameEn: string;
  slug: string;
  iconName: string;
  sortOrder: number;
}) {
  const catId = sanitizeId(`cat_${params.slug}`);
  const path = `categories/${catId}`;
  try {
    await setDoc(doc(db, 'categories', catId), {
      nameNe: clampStr(params.nameNe, 1, 80),
      nameEn: clampStr(params.nameEn, 1, 80),
      slug: sanitizeId(params.slug),
      iconName: clampStr(params.iconName || 'Package', 1, 40),
      sortOrder: Math.max(0, Math.min(1000, Math.round(params.sortOrder))),
      visibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return catId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Log Privacy-Safe Analytics Event
export async function logAnalyticsEvent(
  eventType: 'search' | 'product_view' | 'scanner_use' | 'price_report' | 'seller_register' | 'save_product' | 'ad_impression' | 'ad_click',
  targetId: string,
  district: string,
  metadata: string
) {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const eventId = sanitizeId(`evt_${user.uid}_${Date.now()}`);
  try {
    await setDoc(doc(db, 'analytics', eventId), {
      userId: sanitizeId(user.uid),
      eventType,
      targetId: sanitizeId(targetId || 'general'),
      district: clampStr(district || 'Kathmandu', 2, 60),
      metadata: clampStr(metadata || 'ok', 1, 300),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking telemetry
  }
}
