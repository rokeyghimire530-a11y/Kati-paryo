/**
 * Firestore Security Rules Test Suite for "Kati Paryo?"
 * Verifies that all Dirty Dozen adversarial payloads return PERMISSION_DENIED.
 */

export interface SimulatedContext {
  uid: string | null;
  email?: string;
  emailVerified?: boolean;
}

export interface TestCase {
  id: number;
  name: string;
  context: SimulatedContext;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: TestCase[] = [
  {
    id: 1,
    name: 'Self-Assigned Admin Role on User Creation',
    context: { uid: 'user_123', email: 'attacker@example.com', emailVerified: true },
    operation: 'create',
    path: '/users/user_123',
    payload: {
      uid: 'user_123',
      displayName: 'Attacker',
      email: 'attacker@example.com',
      district: 'Kathmandu',
      language: 'ne',
      role: 'admin',
      notificationsEnabled: true,
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Seller Creation',
    context: { uid: 'user_123', email: 'seller@example.com', emailVerified: true },
    operation: 'create',
    path: '/sellers/seller_123',
    payload: {
      ownerId: 'user_123',
      shopName: 'New Road Mobile Hub',
      district: 'Kathmandu',
      marketArea: 'New Road',
      categoryFocus: 'Mobile & Electronics',
      verified: false,
      status: 'pending',
      visibility: 'public',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
      isSuperSeller: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Self-Verified Seller Bypass',
    context: { uid: 'user_123', email: 'seller@example.com', emailVerified: true },
    operation: 'create',
    path: '/sellers/seller_123',
    payload: {
      ownerId: 'user_123',
      shopName: 'Fake Verified Shop',
      district: 'Pokhara',
      marketArea: 'Chipledhunga',
      categoryFocus: 'Mobile & Electronics',
      verified: true,
      status: 'approved',
      visibility: 'public',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unverified Email Admin Spoof',
    context: { uid: 'spoof_1', email: 'rokeyghimire530@gmail.com', emailVerified: false },
    operation: 'create',
    path: '/categories/cat_mobile',
    payload: {
      nameNe: 'मोबाइल',
      nameEn: 'Mobile',
      slug: 'mobile',
      iconName: 'Smartphone',
      sortOrder: 1,
      visibility: 'public',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Cross-User PII Read on /users/victim_uid',
    context: { uid: 'user_123', email: 'user@example.com', emailVerified: true },
    operation: 'get',
    path: '/users/victim_uid',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Cross-User Seller Private PII Read',
    context: { uid: 'user_123', email: 'user@example.com', emailVerified: true },
    operation: 'get',
    path: '/sellers/seller_victim/private/contact',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Orphaned Price Report Without Existing Product',
    context: { uid: 'user_123', email: 'user@example.com', emailVerified: true },
    operation: 'create',
    path: '/price_reports/report_1',
    payload: {
      userId: 'user_123',
      userName: 'Ramesh',
      productId: 'non_existent_product_999',
      productName: 'Ghost Phone',
      pricePaid: 25000,
      quantity: 1,
      district: 'Kathmandu',
      shopName: 'Bazaar Shop',
      purchaseDate: '2026-10-01',
      receiptUrl: '',
      status: 'pending',
      visibility: 'public',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Identity Spoofing on SavedProduct',
    context: { uid: 'user_123', email: 'user@example.com', emailVerified: true },
    operation: 'create',
    path: '/saved_products/save_1',
    payload: {
      userId: 'other_user_456',
      productId: 'prod_1',
      productName: 'Redmi Note 13',
      brand: 'Xiaomi',
      imageUrl: '/assets/phone.jpg',
      savedAtPrice: 24999,
      currentAvgPrice: 24999,
      alertEnabled: true,
      targetAlertPrice: 23000,
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Denial-of-Wallet 2KB String Overflow',
    context: { uid: 'user_123', email: 'user@example.com', emailVerified: true },
    operation: 'create',
    path: '/reports/flag_1',
    payload: {
      userId: 'user_123',
      productId: 'prod_1',
      productName: 'Redmi Note 13',
      reportedPrice: 999999,
      reason: 'Fake Price',
      details: 'X'.repeat(2000),
      status: 'open',
      createdAt: 'REQUEST_TIME',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'ID Poisoning Attack',
    context: { uid: 'admin_1', email: 'rokeyghimire530@gmail.com', emailVerified: true },
    operation: 'create',
    path: '/products/invalid$id#with!spaces',
    payload: {},
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Immortal Field Mutation on Update',
    context: { uid: 'user_123', email: 'user@example.com', emailVerified: true },
    operation: 'update',
    path: '/users/user_123',
    payload: {
      uid: 'user_123',
      displayName: 'Updated Name',
      email: 'user@example.com',
      district: 'Lalitpur',
      language: 'en',
      role: 'user',
      notificationsEnabled: true,
      createdAt: 'MUTATED_TIMESTAMP',
      updatedAt: 'REQUEST_TIME',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unbounded Client List Scraping on /saved_products',
    context: { uid: 'user_123', email: 'user@example.com', emailVerified: true },
    operation: 'list',
    path: '/saved_products',
    expectedResult: 'PERMISSION_DENIED',
  },
];
