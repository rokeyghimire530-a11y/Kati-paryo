# Kati Paryo? — Firestore Zero-Trust Security Specification

## 1. Data Invariants & Master Source of Truth

1. **Global Default Deny**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false`).
2. **Identity & Verified Email Gate**: Write operations require an authenticated user with `request.auth.token.email_verified == true`.
3. **Admin Authority**: Admin privileges (`isAdmin()`) are never read from client claims or user-writable fields. They are strictly verified via `/admins/$(request.auth.uid)` or the bootstrapped verified admin email (`rokeyghimire530@gmail.com` with `email_verified == true`).
4. **PII Isolation (Split Collection & Owner-Only Guard)**:
   - `/users/{userId}` contains user email and profile settings; `get` and `list` are strictly restricted to `isOwner(userId) || isAdminEmail()`.
   - `/sellers/{sellerId}/private/{infoId}` stores seller phone, email, and PAN; access is strictly restricted to the parent seller's `ownerId` (verified via Master Gate `get()`) or `isAdmin()`.
5. **Relational Master Gate**:
   - A `SellerProduct` can only be created if `/sellers/$(incoming().sellerId)` exists and belongs to `request.auth.uid`, and `/products/$(incoming().productId)` exists.
   - A `PriceReport`, `SavedProduct`, `PriceAlert`, or `FlagReport` can only be created if `/products/$(incoming().productId)` exists and `incoming().userId == request.auth.uid`.
6. **Self-Verification & Privilege Escalation Prevention**:
   - Users creating `/users/{userId}` must set `role == 'user'`.
   - Sellers creating `/sellers/{sellerId}` must set `verified == false` and `status == 'pending'`. Only `isAdmin()` can transition `verified` to `true` or `status` to `'approved'`.
7. **Temporal Integrity & Immortal Fields**:
   - `createdAt` must equal `request.time` on creation and remain immutable (`incoming().createdAt == existing().createdAt`) on update.
   - `updatedAt` must equal `request.time` on creation and update.
8. **Query Enforcer (`allow list`)**:
   - Zero `get()` or `exists()` calls inside any `allow list` block.
   - Public catalog collections enforce `existing().visibility == 'public'`.
   - Private user collections enforce `existing().userId == request.auth.uid`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Self-Assigned Admin Role on User Creation)**:
   ```json
   {
     "uid": "user_123",
     "displayName": "Attacker",
     "email": "attacker@example.com",
     "district": "Kathmandu",
     "language": "ne",
     "role": "admin",
     "notificationsEnabled": true,
     "createdAt": "SERVER_TIMESTAMP",
     "updatedAt": "SERVER_TIMESTAMP"
   }
   ```
2. **Payload 2 (Shadow Field Injection on Seller Creation)**:
   ```json
   {
     "ownerId": "user_123",
     "shopName": "New Road Mobile Hub",
     "district": "Kathmandu",
     "marketArea": "New Road",
     "categoryFocus": "Mobile & Electronics",
     "verified": false,
     "status": "pending",
     "visibility": "public",
     "createdAt": "SERVER_TIMESTAMP",
     "updatedAt": "SERVER_TIMESTAMP",
     "isSuperSeller": true
   }
   ```
3. **Payload 3 (Self-Verified Seller Bypass)**:
   ```json
   {
     "ownerId": "user_123",
     "shopName": "Fake Verified Shop",
     "district": "Pokhara",
     "marketArea": "Chipledhunga",
     "categoryFocus": "Mobile & Electronics",
     "verified": true,
     "status": "approved",
     "visibility": "public",
     "createdAt": "SERVER_TIMESTAMP",
     "updatedAt": "SERVER_TIMESTAMP"
   }
   ```
4. **Payload 4 (Unverified Email Admin Spoof)**:
   Auth token `{ uid: "spoof_1", email: "rokeyghimire530@gmail.com", email_verified: false }` attempting to create a `/categories/cat_1` document.
5. **Payload 5 (Cross-User PII Read on `/users/victim_uid`)**:
   Authenticated `user_123` attempting `getDoc(doc(db, 'users', 'victim_uid'))`.
6. **Payload 6 (Cross-User Seller Private PII Read)**:
   Authenticated `user_123` attempting `getDoc(doc(db, 'sellers/seller_victim/private/contact'))`.
7. **Payload 7 (Orphaned Price Report Without Valid Product)**:
   ```json
   {
     "userId": "user_123",
     "userName": "Ramesh",
     "productId": "non_existent_product_999",
     "productName": "Ghost Phone",
     "pricePaid": 25000,
     "quantity": 1,
     "district": "Kathmandu",
     "shopName": "Bazaar Shop",
     "purchaseDate": "2026-10-01",
     "receiptUrl": "",
     "status": "pending",
     "visibility": "public",
     "createdAt": "SERVER_TIMESTAMP",
     "updatedAt": "SERVER_TIMESTAMP"
   }
   ```
8. **Payload 8 (Identity Spoofing on SavedProduct)**:
   Authenticated `user_123` creating `/saved_products/save_1` with `"userId": "other_user_456"`.
9. **Payload 9 (Denial-of-Wallet 2KB String Overflow)**:
   Creating a `FlagReport` where `details` is a 2,000-character string (exceeding `maxLength: 500`).
10. **Payload 10 (ID Poisoning Attack)**:
    Creating `/products/invalid$id#with!spaces` that violates `^[a-zA-Z0-9_\-]+$`.
11. **Payload 11 (Immortal Field Mutation on Update)**:
    Owner updating `/users/user_123` while mutating `createdAt` or `uid`.
12. **Payload 12 (Unbounded Client List Scraping on `/saved_products`)**:
    Authenticated `user_123` executing an unfiltered `getDocs(collection(db, 'saved_products'))` to read another user's saved products.
